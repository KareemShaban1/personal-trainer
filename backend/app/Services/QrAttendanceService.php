<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\AttendanceTokenType;
use App\Enums\CheckInMethod;
use App\Enums\SubscriptionStatus;
use App\Exceptions\BusinessException;
use App\Models\AttendanceRecord;
use App\Models\AttendanceToken;
use App\Models\Organization;
use App\Models\OrganizationSetting;
use App\Models\Subscription;
use App\Models\Trainee;
use App\Models\User;
use Illuminate\Support\Str;

class QrAttendanceService
{
    public function __construct(
        private readonly AttendanceService $attendanceService,
        private readonly GeolocationService $geolocationService
    ) {}

    public function issueTraineeOpaqueToken(Trainee $trainee): AttendanceToken
    {
        AttendanceToken::query()
            ->where('tokenable_type', Trainee::class)
            ->where('tokenable_id', $trainee->id)
            ->where('type', AttendanceTokenType::TraineeOpaque)
            ->whereNull('used_at')
            ->delete();

        return AttendanceToken::query()->create([
            'organization_id' => $trainee->organization_id,
            'token' => hash('sha256', Str::uuid()->toString().Str::random(32)),
            'type' => AttendanceTokenType::TraineeOpaque,
            'tokenable_type' => Trainee::class,
            'tokenable_id' => $trainee->id,
            'expires_at' => null,
            'meta' => null,
        ]);
    }

    public function issueOrgCheckInQr(Organization $organization, ?int $ttlSeconds = null): AttendanceToken
    {
        $settings = $organization->settings
            ?? OrganizationSetting::query()->firstOrCreate(
                ['organization_id' => $organization->id],
                []
            );

        $ttl = $ttlSeconds ?? $settings->attendance_qr_ttl_seconds ?? 120;

        return AttendanceToken::query()->create([
            'organization_id' => $organization->id,
            'token' => hash('sha256', Str::uuid()->toString().Str::random(32)),
            'type' => AttendanceTokenType::OrgCheckIn,
            'tokenable_type' => Organization::class,
            'tokenable_id' => $organization->id,
            'expires_at' => now()->addSeconds($ttl),
            'meta' => ['ttl_seconds' => $ttl],
        ]);
    }

    public function scanTraineeToken(
        string $token,
        ?User $actor = null,
        ?float $latitude = null,
        ?float $longitude = null
    ): AttendanceRecord {
        $attendanceToken = AttendanceToken::query()
            ->where('token', $token)
            ->where('type', AttendanceTokenType::TraineeOpaque)
            ->first();

        if (! $attendanceToken) {
            throw new BusinessException('Invalid trainee QR token.', 404);
        }

        /** @var Trainee $trainee */
        $trainee = $attendanceToken->tokenable;

        if (! $trainee instanceof Trainee) {
            throw new BusinessException('Invalid trainee QR token.', 404);
        }

        $subscription = $this->resolveActiveSubscription($trainee);

        return $this->attendanceService->mark(
            $trainee,
            $subscription,
            AttendanceStatus::Present,
            now(),
            CheckInMethod::QrScan,
            $actor,
            $trainee->branch,
            $latitude,
            $longitude
        );
    }

    public function selfCheckIn(
        Trainee $trainee,
        string $orgQrToken,
        ?float $latitude = null,
        ?float $longitude = null
    ): AttendanceRecord {
        $token = AttendanceToken::query()
            ->where('token', $orgQrToken)
            ->where('type', AttendanceTokenType::OrgCheckIn)
            ->first();

        if (! $token) {
            throw new BusinessException('Invalid check-in QR code.', 404);
        }

        if ($token->organization_id !== $trainee->organization_id) {
            throw new BusinessException('QR code does not belong to your organization.', 403);
        }

        if ($token->isExpired()) {
            throw new BusinessException('Check-in QR code has expired.', 422);
        }

        $organization = Organization::query()->with('settings')->findOrFail($trainee->organization_id);
        $settings = $organization->settings;

        if ($settings?->require_geolocation) {
            if ($latitude === null || $longitude === null) {
                throw new BusinessException('Geolocation is required for check-in.');
            }

            $branch = $trainee->branch;
            if ($branch?->latitude !== null && $branch?->longitude !== null) {
                $within = $this->geolocationService->isWithinRadius(
                    (float) $branch->latitude,
                    (float) $branch->longitude,
                    $latitude,
                    $longitude,
                    (float) $settings->check_in_radius_meters
                );

                if (! $within) {
                    throw new BusinessException('You are outside the allowed check-in radius.');
                }
            }
        }

        $subscription = $this->resolveActiveSubscription($trainee);

        return $this->attendanceService->mark(
            $trainee,
            $subscription,
            AttendanceStatus::Present,
            now(),
            CheckInMethod::SelfCheckIn,
            $trainee->user,
            $trainee->branch,
            $latitude,
            $longitude
        );
    }

    private function resolveActiveSubscription(Trainee $trainee): Subscription
    {
        $subscription = Subscription::query()
            ->where('trainee_id', $trainee->id)
            ->where('status', SubscriptionStatus::Active)
            ->where('remaining_sessions', '>', 0)
            ->orderByDesc('id')
            ->first();

        if (! $subscription) {
            throw new BusinessException('No active subscription with remaining sessions.');
        }

        return $subscription;
    }
}
