<?php

namespace App\Console\Commands;

use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;

class DispatchSubscriptionAlerts extends Command
{
    protected $signature = 'saas:dispatch-subscription-alerts';

    protected $description = 'Send in-app notifications for expiring subscriptions and low remaining sessions';

    public function handle(NotificationDispatcher $dispatcher): int
    {
        $sent = $dispatcher->dispatchSubscriptionAlerts();
        $this->info("Dispatched {$sent} notification(s).");

        return self::SUCCESS;
    }
}
