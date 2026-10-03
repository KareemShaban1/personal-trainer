<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\SuperAdmin\OrganizationController as SuperAdminOrganizationController;
use App\Http\Controllers\Api\SystemAppearanceController;
use App\Http\Controllers\Api\TraineeController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])
        ->middleware('throttle:auth');
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:auth');
    Route::post('super-admin/login', [AuthController::class, 'superAdminLogin'])
        ->middleware('throttle:auth');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:auth');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:auth');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware(['auth:sanctum', 'organization'])->group(function () {
    Route::get('dashboard', DashboardController::class);

    Route::get('organization', [OrganizationController::class, 'show']);
    Route::put('organization', [OrganizationController::class, 'update']);
    Route::get('organization/settings', [OrganizationController::class, 'settings']);
    Route::put('organization/settings', [OrganizationController::class, 'updateSettings']);

    Route::apiResource('trainees', TraineeController::class);
    Route::apiResource('parents', ParentController::class);
    Route::apiResource('packages', PackageController::class);

    Route::get('subscriptions', [SubscriptionController::class, 'index']);
    Route::post('subscriptions', [SubscriptionController::class, 'store']);
    Route::get('subscriptions/{subscription}', [SubscriptionController::class, 'show']);
    Route::post('subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('subscriptions/{subscription}/suspend', [SubscriptionController::class, 'suspend']);
    Route::post('subscriptions/{subscription}/resume', [SubscriptionController::class, 'resume']);

    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::get('payments/{payment}', [PaymentController::class, 'show']);

    Route::get('attendance', [AttendanceController::class, 'index']);
    Route::post('attendance', [AttendanceController::class, 'store']);
    Route::post('attendance/bulk', [AttendanceController::class, 'bulkStore']);
    Route::put('attendance/{attendance}', [AttendanceController::class, 'update']);
    Route::post('attendance/scan', [AttendanceController::class, 'scan']);
    Route::post('attendance/self-check-in', [AttendanceController::class, 'selfCheckIn']);
    Route::get('attendance/my-qr', [AttendanceController::class, 'myQrToken']);
    Route::post('attendance/org-qr', [AttendanceController::class, 'orgCheckInQr']);

    Route::get('progress', [ProgressController::class, 'index']);
    Route::post('progress', [ProgressController::class, 'store']);
    Route::get('progress/{progress}', [ProgressController::class, 'show']);

    Route::get('notes', [NoteController::class, 'index']);
    Route::post('notes', [NoteController::class, 'store']);
    Route::delete('notes/{note}', [NoteController::class, 'destroy']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    Route::get('reports/summary', [ReportController::class, 'summary']);
    Route::get('reports/attendance', [ReportController::class, 'attendance']);
    Route::get('reports/revenue', [ReportController::class, 'revenue']);
    Route::get('reports/subscriptions', [ReportController::class, 'subscriptions']);
    Route::get('reports/export', [ReportController::class, 'export']);

    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);

    Route::get('search', SearchController::class);
});

Route::get('system/appearance', [SystemAppearanceController::class, 'show']);

Route::middleware(['auth:sanctum'])->prefix('super-admin')->group(function () {
    Route::get('organizations', [SuperAdminOrganizationController::class, 'index']);
    Route::get('organizations/{organization}', [SuperAdminOrganizationController::class, 'show']);
    Route::patch('organizations/{organization}/status', [SuperAdminOrganizationController::class, 'updateStatus']);
    Route::get('appearance', [SystemAppearanceController::class, 'show']);
    Route::put('appearance', [SystemAppearanceController::class, 'update']);
});
