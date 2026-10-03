<?php

use App\Enums\Role;
use App\Models\Organization;
use App\Models\Trainee;
use App\Support\CurrentOrganization;

beforeEach(function () {
    seedRoles();
});

it('isolates tenants so org A cannot see org B trainees', function () {
    $orgA = createOrganization(['name' => 'Org A', 'slug' => 'org-a']);
    $orgB = createOrganization(['name' => 'Org B', 'slug' => 'org-b']);

    $ownerA = createStaffUser($orgA, Role::OrganizationOwner, ['email' => 'a@test.com']);
    createStaffUser($orgB, Role::OrganizationOwner, ['email' => 'b@test.com']);

    createTraineeUser($orgA);
    $traineeB = createTraineeUser($orgB)['trainee'];

    CurrentOrganization::set($orgA->id);

    $response = $this->withHeaders(authHeaders($ownerA, $orgA))
        ->getJson('/api/trainees');

    $response->assertOk();

    $ids = collect($response->json('data'))->pluck('id')->all();

    expect($ids)->not->toContain($traineeB->id);
});

it('logs in staff with email and password', function () {
    $org = createOrganization();
    createStaffUser($org, Role::OrganizationOwner, ['email' => 'owner@login.test']);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'owner@login.test',
        'password' => 'Password123!',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'token_type', 'user']);
});

it('logs in trainee with phone and password', function () {
    $org = createOrganization();
    createTraineeUser($org, null, ['phone' => '01001112233']);

    $response = $this->postJson('/api/auth/login', [
        'phone' => '01001112233',
        'password' => 'Password123!',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.phone', '01001112233');
});
