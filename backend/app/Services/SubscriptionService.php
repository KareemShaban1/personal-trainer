<?php

namespace App\Services;

use App\Enums\SubscriptionStatus;
use App\Enums\TransactionType;
use App\Exceptions\BusinessException;
use App\Models\Package;
use App\Models\Subscription;
use App\Models\SubscriptionTransaction;
use App\Models\Trainee;
use App\Models\User;
use App\Support\CurrentOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    public function __construct(
        private readonly AuditLogger $auditLogger
    ) {}

    public function createFromPackage(
        Trainee $trainee,
        Package $package,
        ?Carbon $startedAt = null,
        ?User $actor = null,
        ?string $notes = null
    ): Subscription {
        if ($trainee->organization_id !== $package->organization_id) {
            throw new BusinessException('Trainee and package must belong to the same organization.');
        }

        if (! $package->is_active) {
            throw new BusinessException('Package is not active.');
        }

        $startedAt ??= now();

        return DB::transaction(function () use ($trainee, $package, $startedAt, $actor, $notes) {
            $subscription = Subscription::query()->create([
                'organization_id' => $trainee->organization_id,
                'trainee_id' => $trainee->id,
                'package_id' => $package->id,
                'status' => SubscriptionStatus::Active,
                'started_at' => $startedAt->toDateString(),
                'ends_at' => $package->duration_days
                    ? $startedAt->copy()->addDays($package->duration_days)->toDateString()
                    : null,
                'remaining_sessions' => 0,
                'notes' => $notes,
            ]);

            $this->applyTransaction(
                $subscription,
                TransactionType::Credit,
                $package->sessions_count,
                'Initial package sessions',
                $package,
                $actor
            );

            $this->auditLogger->log('subscription.created', $subscription, null, $subscription->toArray(), $actor);

            return $subscription->fresh(['package', 'trainee', 'transactions']);
        });
    }

    public function cancel(Subscription $subscription, ?User $actor = null, ?string $reason = null): Subscription
    {
        $subscription->status = SubscriptionStatus::Cancelled;
        if ($reason) {
            $subscription->notes = trim(($subscription->notes ? $subscription->notes."\n" : '').'Cancelled: '.$reason);
        }
        $subscription->save();

        $this->auditLogger->log('subscription.cancelled', $subscription, null, [
            'reason' => $reason,
        ], $actor);

        return $subscription->fresh();
    }

    public function suspend(Subscription $subscription, ?User $actor = null, ?string $reason = null): Subscription
    {
        if ($subscription->status !== SubscriptionStatus::Active) {
            throw new BusinessException('Only active subscriptions can be suspended.');
        }

        $subscription->status = SubscriptionStatus::Suspended;
        if ($reason) {
            $subscription->notes = trim(($subscription->notes ? $subscription->notes."\n" : '').'Suspended: '.$reason);
        }
        $subscription->save();

        $this->auditLogger->log('subscription.suspended', $subscription, null, [
            'reason' => $reason,
        ], $actor);

        return $subscription->fresh();
    }

    public function resume(Subscription $subscription, ?User $actor = null): Subscription
    {
        if ($subscription->status !== SubscriptionStatus::Suspended) {
            throw new BusinessException('Only suspended subscriptions can be resumed.');
        }

        $subscription->status = SubscriptionStatus::Active;
        $subscription->save();

        $this->auditLogger->log('subscription.resumed', $subscription, null, null, $actor);

        return $subscription->fresh();
    }

    /**
     * Remaining sessions may only change through this method.
     */
    public function applyTransaction(
        Subscription $subscription,
        TransactionType $type,
        int $sessionsDelta,
        ?string $reason = null,
        ?Model $reference = null,
        ?User $actor = null
    ): SubscriptionTransaction {
        return DB::transaction(function () use ($subscription, $type, $sessionsDelta, $reason, $reference, $actor) {
            /** @var Subscription $locked */
            $locked = Subscription::query()->lockForUpdate()->findOrFail($subscription->id);

            $delta = match ($type) {
                TransactionType::Credit => abs($sessionsDelta),
                TransactionType::Debit => -abs($sessionsDelta),
                TransactionType::Adjustment => $sessionsDelta,
            };

            $newBalance = $locked->remaining_sessions + $delta;

            if ($newBalance < 0) {
                throw new BusinessException('Insufficient remaining sessions.', 422);
            }

            $locked->remaining_sessions = $newBalance;
            $locked->save();

            $transaction = SubscriptionTransaction::query()->create([
                'organization_id' => $locked->organization_id,
                'subscription_id' => $locked->id,
                'type' => $type,
                'sessions_delta' => $delta,
                'balance_after' => $newBalance,
                'reason' => $reason,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'created_by' => $actor?->id,
            ]);

            return $transaction;
        });
    }
}
