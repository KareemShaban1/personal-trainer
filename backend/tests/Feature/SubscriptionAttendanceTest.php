<?php

use App\Enums\AttendanceStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Services\AttendanceService;
use App\Services\QrAttendanceService;
use App\Services\SubscriptionService;
use App\Support\CurrentOrganization;

beforeEach(function () {
    seedRoles();
});

it('creates a subscription from a package with remaining sessions', function () {
    $org = createOrganization();
    $owner = createStaffUser($org);
    $trainee = createTraineeUser($org)['trainee'];
    $package = createPackage($org, 10);

    CurrentOrganization::set($org->id);

    $response = $this->withHeaders(authHeaders($owner, $org))
        ->postJson('/api/subscriptions', [
            'trainee_id' => $trainee->id,
            'package_id' => $package->id,
        ]);

    $response->assertCreated()
        ->assertJsonPath('subscription.remaining_sessions', 10)
        ->assertJsonPath('subscription.status', SubscriptionStatus::Active->value);

    expect(Subscription::query()->find($response->json('subscription.id'))->transactions)->toHaveCount(1);
});

it('decrements remaining sessions from 10 to 9 on present attendance', function () {
    $org = createOrganization();
    $owner = createStaffUser($org);
    $trainee = createTraineeUser($org)['trainee'];
    $package = createPackage($org, 10);

    CurrentOrganization::set($org->id);

    $subscription = app(SubscriptionService::class)->createFromPackage($trainee, $package, actor: $owner);
    expect($subscription->remaining_sessions)->toBe(10);

    $record = app(AttendanceService::class)->mark(
        $trainee,
        $subscription,
        AttendanceStatus::Present,
        now(),
        actor: $owner
    );

    expect($record->status)->toBe(AttendanceStatus::Present)
        ->and($subscription->fresh()->remaining_sessions)->toBe(9);
});

it('blocks duplicate attendance for same trainee subscription and date', function () {
    $org = createOrganization();
    $owner = createStaffUser($org);
    $trainee = createTraineeUser($org)['trainee'];
    $package = createPackage($org, 10);
    CurrentOrganization::set($org->id);

    $subscription = app(SubscriptionService::class)->createFromPackage($trainee, $package, actor: $owner);

    app(AttendanceService::class)->mark($trainee, $subscription, AttendanceStatus::Present, '2026-10-01', actor: $owner);

    $this->expectException(\App\Exceptions\BusinessException::class);

    app(AttendanceService::class)->mark($trainee, $subscription->fresh(), AttendanceStatus::Present, '2026-10-01', actor: $owner);
});

it('blocks attendance when remaining sessions are zero', function () {
    $org = createOrganization();
    $owner = createStaffUser($org);
    $trainee = createTraineeUser($org)['trainee'];
    $package = createPackage($org, 1);
    CurrentOrganization::set($org->id);

    $subscription = app(SubscriptionService::class)->createFromPackage($trainee, $package, actor: $owner);

    app(AttendanceService::class)->mark($trainee, $subscription, AttendanceStatus::Present, '2026-10-01', actor: $owner);

    $this->expectException(\App\Exceptions\BusinessException::class);

    app(AttendanceService::class)->mark($trainee, $subscription->fresh(), AttendanceStatus::Present, '2026-10-02', actor: $owner);
});

it('rejects expired organization check-in QR codes', function () {
    $org = createOrganization();
    createStaffUser($org);
    $trainee = createTraineeUser($org)['trainee'];
    $package = createPackage($org, 5);
    CurrentOrganization::set($org->id);

    app(SubscriptionService::class)->createFromPackage($trainee, $package);

    $token = app(QrAttendanceService::class)->issueOrgCheckInQr($org, 1);
    $token->expires_at = now()->subMinute();
    $token->save();

    $this->expectException(\App\Exceptions\BusinessException::class);

    app(QrAttendanceService::class)->selfCheckIn($trainee, $token->token);
});

it('records bulk attendance for multiple trainees', function () {
    $org = createOrganization();
    $owner = createStaffUser($org);
    $traineeA = createTraineeUser($org)['trainee'];
    $traineeB = createTraineeUser($org)['trainee'];
    $package = createPackage($org, 10);
    CurrentOrganization::set($org->id);

    $subA = app(SubscriptionService::class)->createFromPackage($traineeA, $package, actor: $owner);
    $subB = app(SubscriptionService::class)->createFromPackage($traineeB, $package, actor: $owner);

    $response = $this->withHeaders(authHeaders($owner, $org))
        ->postJson('/api/attendance/bulk', [
            'attendance_date' => '2026-10-03',
            'records' => [
                [
                    'trainee_id' => $traineeA->id,
                    'subscription_id' => $subA->id,
                    'status' => 'present',
                    'notes' => 'On time',
                ],
                [
                    'trainee_id' => $traineeB->id,
                    'status' => 'absent',
                    'notes' => 'Sick',
                ],
            ],
        ]);

    $response->assertCreated()
        ->assertJsonPath('recorded_count', 2)
        ->assertJsonPath('error_count', 0);

    expect($subA->fresh()->remaining_sessions)->toBe(9)
        ->and($subB->fresh()->remaining_sessions)->toBe(10);
});

it('updates existing attendance status and adjusts sessions', function () {
    $org = createOrganization();
    $owner = createStaffUser($org);
    $trainee = createTraineeUser($org)['trainee'];
    $package = createPackage($org, 10);
    CurrentOrganization::set($org->id);

    $subscription = app(SubscriptionService::class)->createFromPackage($trainee, $package, actor: $owner);

    $this->withHeaders(authHeaders($owner, $org))
        ->postJson('/api/attendance/bulk', [
            'attendance_date' => '2026-10-03',
            'records' => [
                [
                    'trainee_id' => $trainee->id,
                    'subscription_id' => $subscription->id,
                    'status' => 'present',
                ],
            ],
        ])
        ->assertCreated();

    expect($subscription->fresh()->remaining_sessions)->toBe(9);

    $response = $this->withHeaders(authHeaders($owner, $org))
        ->postJson('/api/attendance/bulk', [
            'attendance_date' => '2026-10-03',
            'records' => [
                [
                    'trainee_id' => $trainee->id,
                    'status' => 'absent',
                    'notes' => 'Changed to absent',
                ],
            ],
        ]);

    $response->assertCreated()
        ->assertJsonPath('recorded_count', 1)
        ->assertJsonPath('recorded.0.status', 'absent')
        ->assertJsonPath('recorded.0.notes', 'Changed to absent');

    expect($subscription->fresh()->remaining_sessions)->toBe(10);
});
