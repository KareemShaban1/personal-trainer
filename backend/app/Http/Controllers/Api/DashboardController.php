<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\SubscriptionResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function __invoke(): JsonResponse
    {
        $data = $this->dashboardService->forOrganization();

        return response()->json([
            'stats' => [
                'trainees_count' => $data['trainees_count'],
                'active_subscriptions' => $data['active_subscriptions'],
                'attendance_today' => $data['attendance_today'],
                'present_today' => $data['present_today'],
                'revenue_this_month' => $data['revenue_this_month'],
            ],
            'low_session_subscriptions' => SubscriptionResource::collection($data['low_session_subscriptions']),
            'recent_attendance' => AttendanceResource::collection($data['recent_attendance']),
        ]);
    }
}