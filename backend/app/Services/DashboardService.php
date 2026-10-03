<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\AttendanceRecord;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Trainee;
use Carbon\Carbon;

class DashboardService
{
    public function forOrganization(): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();

        return [
            'trainees_count' => Trainee::query()->count(),
            'active_subscriptions' => Subscription::query()
                ->where('status', SubscriptionStatus::Active)
                ->count(),
            'attendance_today' => AttendanceRecord::query()
                ->whereDate('attendance_date', $today)
                ->count(),
            'present_today' => AttendanceRecord::query()
                ->whereDate('attendance_date', $today)
                ->where('status', AttendanceStatus::Present)
                ->count(),
            'revenue_this_month' => (float) Payment::query()
                ->where('status', PaymentStatus::Completed)
                ->whereDate('paid_at', '>=', $monthStart)
                ->sum('amount'),
            'low_session_subscriptions' => Subscription::query()
                ->with(['trainee.user', 'package'])
                ->where('status', SubscriptionStatus::Active)
                ->where('remaining_sessions', '<=', 3)
                ->orderBy('remaining_sessions')
                ->limit(10)
                ->get(),
            'recent_attendance' => AttendanceRecord::query()
                ->with(['trainee.user'])
                ->orderByDesc('checked_in_at')
                ->limit(10)
                ->get(),
        ];
    }
}
