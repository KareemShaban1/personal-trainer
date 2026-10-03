<?php

use App\Enums\OrganizationStatus;
use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\Branch;
use App\Models\Organization;
use App\Models\OrganizationSetting;
use App\Models\OrganizationUser;
use App\Models\Package;
use App\Models\ParentProfile;
use App\Models\Trainee;
use App\Models\User;
use App\Support\CurrentOrganization;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

pest()->extend(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

function seedRoles(): void
{
    test()->seed(RolesAndPermissionsSeeder::class);
}

function createOrganization(array $attrs = []): Organization
{
    $org = Organization::query()->create(array_merge([
        'name' => 'Test Org',
        'slug' => 'test-org-'.uniqid(),
        'email' => 'org@test.com',
        'country' => 'Egypt',
        'city' => 'Cairo',
        'timezone' => 'Africa/Cairo',
        'currency' => 'EGP',
        'status' => OrganizationStatus::Active,
    ], $attrs));

    OrganizationSetting::query()->create([
        'organization_id' => $org->id,
        'attendance_qr_ttl_seconds' => 60,
        'require_geolocation' => false,
        'check_in_radius_meters' => 150,
    ]);

    return $org;
}

function createStaffUser(Organization $org, Role $role = Role::OrganizationOwner, array $attrs = []): User
{
    $user = User::query()->create(array_merge([
        'first_name' => 'Staff',
        'last_name' => $role->value,
        'email' => $role->value.'@'.$org->slug.'.test',
        'phone' => '01'.random_int(10000000, 99999999),
        'status' => UserStatus::Active,
        'password' => Hash::make('Password123!'),
        'email_verified_at' => now(),
    ], $attrs));

    $user->assignRole($role->value);

    OrganizationUser::query()->create([
        'organization_id' => $org->id,
        'user_id' => $user->id,
        'is_owner' => $role === Role::OrganizationOwner,
        'status' => 'active',
    ]);

    return $user;
}

function createTraineeUser(Organization $org, ?Branch $branch = null, array $attrs = []): array
{
    $user = User::query()->create(array_merge([
        'first_name' => 'Trainee',
        'last_name' => 'User',
        'phone' => $attrs['phone'] ?? ('01'.random_int(10000000, 99999999)),
        'email' => null,
        'status' => UserStatus::Active,
        'password' => Hash::make('Password123!'),
        'phone_verified_at' => now(),
    ], collect($attrs)->except('phone')->all()));

    $user->assignRole(Role::Trainee->value);

    OrganizationUser::query()->create([
        'organization_id' => $org->id,
        'user_id' => $user->id,
        'branch_id' => $branch?->id,
        'status' => 'active',
    ]);

    CurrentOrganization::set($org->id);

    $trainee = Trainee::query()->create([
        'organization_id' => $org->id,
        'user_id' => $user->id,
        'branch_id' => $branch?->id,
        'code' => 'T-'.uniqid(),
        'status' => 'active',
    ]);

    return compact('user', 'trainee');
}

function createParentWithChild(Organization $org, Trainee $trainee): array
{
    $user = User::query()->create([
        'first_name' => 'Parent',
        'last_name' => 'User',
        'phone' => '01'.random_int(10000000, 99999999),
        'status' => UserStatus::Active,
        'password' => Hash::make('Password123!'),
        'phone_verified_at' => now(),
    ]);
    $user->assignRole(Role::Parent->value);

    OrganizationUser::query()->create([
        'organization_id' => $org->id,
        'user_id' => $user->id,
        'status' => 'active',
    ]);

    CurrentOrganization::set($org->id);

    $parent = ParentProfile::query()->create([
        'organization_id' => $org->id,
        'user_id' => $user->id,
        'status' => 'active',
    ]);
    $parent->trainees()->attach($trainee->id, ['relationship' => 'guardian']);

    return compact('user', 'parent');
}

function createPackage(Organization $org, int $sessions = 10): Package
{
    CurrentOrganization::set($org->id);

    return Package::query()->create([
        'organization_id' => $org->id,
        'name' => 'Test Package '.$sessions,
        'sessions_count' => $sessions,
        'duration_days' => 30,
        'price' => 500,
        'currency' => 'EGP',
        'is_active' => true,
    ]);
}

function authHeaders(User $user, ?Organization $org = null): array
{
    $token = $user->createToken('test')->plainTextToken;
    $headers = [
        'Authorization' => 'Bearer '.$token,
        'Accept' => 'application/json',
    ];

    if ($org) {
        $headers['X-Organization-Id'] = (string) $org->id;
    }

    return $headers;
}
