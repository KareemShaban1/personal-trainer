<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\CheckInMethod;
use App\Enums\SubscriptionStatus;
use App\Enums\TransactionType;
use App\Exceptions\BusinessException;
use App\Models\AttendanceRecord;
use App\Models\Branch;
use App\Models\Subscription;
use App\Models\Trainee;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
        private readonly AuditLogger $auditLogger
    ) {}

    public function mark(
        Trainee $trainee,
        Subscription $subscription,
        AttendanceStatus $status,
        Carbon|string|null $date = null,
        CheckInMethod $method = CheckInMethod::Manual,
        ?User $actor = null,
        ?Branch $branch = null,
        ?float $latitude = null,
        ?float $longitude = null,
        ?string $notes = null
    ): AttendanceRecord {
        $attendanceDate = Carbon::parse($date ?? now())->toDateString();

        if ($subscription->trainee_id !== $trainee->id) {
            throw new BusinessException('Subscription does not belong to this trainee.');
        }

        if ($subscription->organization_id !== $trainee->organization_id) {
            throw new BusinessException('Trainee and subscription organization mismatch.');
        }

        if ($subscription->status !== SubscriptionStatus::Active) {
            throw new BusinessException('Subscription is not active.');
        }

        return DB::transaction(function () use (
            $trainee,
            $subscription,
            $status,
            $attendanceDate,
            $method,
            $actor,
            $branch,
            $latitude,
            $longitude,
            $notes
        ) {
            $exists = AttendanceRecord::query()
                ->where('trainee_id', $trainee->id)
                ->where('subscription_id', $subscription->id)
                ->whereDate('attendance_date', $attendanceDate)
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                throw new BusinessException('Attendance already recorded for this trainee, subscription, and date.', 422);
            }

            $record = AttendanceRecord::query()->create([
                'organization_id' => $trainee->organization_id,
                'trainee_id' => $trainee->id,
                'subscription_id' => $subscription->id,
                'branch_id' => $branch?->id,
                'status' => $status,
                'attendance_date' => $attendanceDate,
                'checked_in_at' => in_array($status, [AttendanceStatus::Present, AttendanceStatus::Late], true)
                    ? now()
                    : null,
                'check_in_method' => $method,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'recorded_by' => $actor?->id,
                'notes' => $notes,
            ]);

            if ($this->shouldConsumeSession($trainee, $status)) {
                $this->subscriptionService->applyTransaction(
                    $subscription,
                    TransactionType::Debit,
                    1,
                    'Attendance '.$status->value.' on '.$attendanceDate,
                    $record,
                    $actor
                );
            }

            $this->auditLogger->log('attendance.marked', $record, null, $record->toArray(), $actor);

            return $record->fresh(['trainee', 'subscription']);
        });
    }

    public function update(
        AttendanceRecord $record,
        AttendanceStatus $status,
        ?string $notes = null,
        ?User $actor = null
    ): AttendanceRecord {
        return DB::transaction(function () use ($record, $status, $notes, $actor) {
            /** @var AttendanceRecord $locked */
            $locked = AttendanceRecord::query()->lockForUpdate()->findOrFail($record->id);
            $before = $locked->toArray();
            $oldStatus = $locked->status;

            $locked->loadMissing(['trainee.organization.settings', 'subscription']);

            $wasConsuming = $this->shouldConsumeSession($locked->trainee, $oldStatus);
            $willConsume = $this->shouldConsumeSession($locked->trainee, $status);

            $locked->status = $status;
            $locked->notes = $notes;
            $locked->checked_in_at = in_array($status, [AttendanceStatus::Present, AttendanceStatus::Late], true)
                ? ($locked->checked_in_at ?? now())
                : null;
            $locked->recorded_by = $actor?->id ?? $locked->recorded_by;
            $locked->save();

            if ($wasConsuming && ! $willConsume && $locked->subscription) {
                $this->subscriptionService->applyTransaction(
                    $locked->subscription,
                    TransactionType::Credit,
                    1,
                    'Attendance status changed from '.$oldStatus->value.' to '.$status->value,
                    $locked,
                    $actor
                );
            } elseif (! $wasConsuming && $willConsume && $locked->subscription) {
                $this->subscriptionService->applyTransaction(
                    $locked->subscription,
                    TransactionType::Debit,
                    1,
                    'Attendance status changed from '.$oldStatus->value.' to '.$status->value,
                    $locked,
                    $actor
                );
            }

            $this->auditLogger->log('attendance.updated', $locked, $before, $locked->toArray(), $actor);

            return $locked->fresh(['trainee', 'subscription']);
        });
    }

    /**
     * @param  array<int, array{trainee_id: int, subscription_id?: int|null, status: string, notes?: string|null}>  $records
     * @return array{recorded: list<AttendanceRecord>, errors: list<array{trainee_id: int, message: string}>}
     */
    public function markBulk(
        array $records,
        Carbon|string|null $date = null,
        ?User $actor = null
    ): array {
        $attendanceDate = Carbon::parse($date ?? now())->toDateString();
        $recorded = [];
        $errors = [];

        foreach ($records as $item) {
            $traineeId = (int) $item['trainee_id'];

            try {
                $trainee = Trainee::query()->findOrFail($traineeId);
                $status = AttendanceStatus::from($item['status']);
                $notes = $item['notes'] ?? null;

                $existing = AttendanceRecord::query()
                    ->where('trainee_id', $trainee->id)
                    ->whereDate('attendance_date', $attendanceDate)
                    ->orderByDesc('id')
                    ->first();

                if ($existing) {
                    $recorded[] = $this->update($existing, $status, $notes, $actor);
                    continue;
                }

                $subscription = isset($item['subscription_id'])
                    ? Subscription::query()->findOrFail((int) $item['subscription_id'])
                    : $this->resolveActiveSubscription($trainee);

                $recorded[] = $this->mark(
                    $trainee,
                    $subscription,
                    $status,
                    $attendanceDate,
                    actor: $actor,
                    notes: $notes
                );
            } catch (BusinessException $e) {
                $errors[] = [
                    'trainee_id' => $traineeId,
                    'message' => $e->getMessage(),
                ];
            } catch (\Throwable $e) {
                $errors[] = [
                    'trainee_id' => $traineeId,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return compact('recorded', 'errors');
    }

    public function resolveActiveSubscription(Trainee $trainee): Subscription
    {
        $subscription = Subscription::query()
            ->where('trainee_id', $trainee->id)
            ->where('status', SubscriptionStatus::Active)
            ->orderByDesc('id')
            ->first();

        if (! $subscription) {
            throw new BusinessException('No active subscription for this trainee.');
        }

        return $subscription;
    }

    private function shouldConsumeSession(Trainee $trainee, AttendanceStatus $status): bool
    {
        $trainee->loadMissing('organization.settings');
        $settings = $trainee->organization?->settings;
        $consumeOnLate = (bool) data_get($settings?->settings, 'consume_session_on_late', false);

        return $status === AttendanceStatus::Present
            || ($status === AttendanceStatus::Late && $consumeOnLate);
    }
}
