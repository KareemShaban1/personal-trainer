<?php

namespace App\Services;

use App\Enums\SubscriptionStatus;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use App\Notifications\SubscriptionAlertNotification;

class NotificationDispatcher
{
    /**
     * Send in-app alerts for expiring packages and low remaining sessions.
     * Email/SMS/WhatsApp channels can be added later via Laravel notification channels.
     */
    public function dispatchSubscriptionAlerts(?Organization $organization = null): int
    {
        $query = Subscription::query()
            ->with(['trainee.user', 'organization.users'])
            ->where('status', SubscriptionStatus::Active);

        if ($organization) {
            $query->where('organization_id', $organization->id);
        }

        $sent = 0;

        $query->chunkById(100, function ($subscriptions) use (&$sent) {
            foreach ($subscriptions as $subscription) {
                $recipients = $this->staffRecipients($subscription);

                if ($subscription->ends_at && $subscription->ends_at->lte(now()->addDays(7))) {
                    Notification::send($recipients, new SubscriptionAlertNotification(
                        type: 'subscription.expiring',
                        title: 'Subscription expiring soon',
                        body: sprintf(
                            'Subscription #%d for %s expires on %s.',
                            $subscription->id,
                            $subscription->trainee?->user?->name ?? 'trainee',
                            $subscription->ends_at->toDateString()
                        ),
                        data: ['subscription_id' => $subscription->id]
                    ));
                    $sent += $recipients->count();
                }

                if ($subscription->remaining_sessions > 0 && $subscription->remaining_sessions <= 3) {
                    Notification::send($recipients, new SubscriptionAlertNotification(
                        type: 'subscription.low_sessions',
                        title: 'Sessions running low',
                        body: sprintf(
                            '%s has %d session(s) remaining.',
                            $subscription->trainee?->user?->name ?? 'Trainee',
                            $subscription->remaining_sessions
                        ),
                        data: ['subscription_id' => $subscription->id]
                    ));
                    $sent += $recipients->count();
                }
            }
        });

        return $sent;
    }

    /** @return \Illuminate\Support\Collection<int, User> */
    private function staffRecipients(Subscription $subscription)
    {
        $orgUsers = $subscription->organization?->users ?? collect();

        return $orgUsers->filter(function (User $user) {
            return $user->hasAnyRole(['organization_owner', 'trainer', 'staff']);
        })->values();
    }
}
