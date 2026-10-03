<?php

namespace Database\Seeders;

use App\Enums\AttendanceStatus;
use App\Enums\CheckInMethod;
use App\Enums\Gender;
use App\Enums\OrganizationStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\Branch;
use App\Models\Organization;
use App\Models\OrganizationSetting;
use App\Models\OrganizationUser;
use App\Models\Package;
use App\Models\ParentProfile;
use App\Models\Payment;
use App\Models\SkillCategory;
use App\Models\Trainee;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\SubscriptionService;
use App\Support\CurrentOrganization;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('Password123!');

        $superAdmin = User::query()->create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@trainer.saas',
            'phone' => '01000000999',
            'status' => UserStatus::Active,
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $superAdmin->assignRole(Role::SuperAdmin->value);

        $organization = Organization::query()->create([
            'name' => 'Demo Academy',
            'slug' => 'demo-academy',
            'email' => 'owner@demo.academy',
            'phone' => '01000000000',
            'country' => 'Egypt',
            'city' => 'Cairo',
            'timezone' => 'Africa/Cairo',
            'currency' => 'EGP',
            'status' => OrganizationStatus::Active,
        ]);

        OrganizationSetting::query()->create([
            'organization_id' => $organization->id,
            'check_in_radius_meters' => 200,
            'require_geolocation' => false,
            'attendance_qr_ttl_seconds' => 120,
        ]);

        CurrentOrganization::set($organization->id);

        $branch = Branch::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Nasr City Branch',
            'address' => 'Cairo, Egypt',
            'latitude' => 30.0444,
            'longitude' => 31.2357,
            'phone' => '01000000000',
            'status' => 'active',
        ]);

        $owner = User::query()->create([
            'first_name' => 'Omar',
            'last_name' => 'Owner',
            'email' => 'owner@demo.academy',
            'phone' => '01000000010',
            'status' => UserStatus::Active,
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $owner->assignRole(Role::OrganizationOwner->value);

        $trainer = User::query()->create([
            'first_name' => 'Tarek',
            'last_name' => 'Trainer',
            'email' => 'trainer@demo.academy',
            'phone' => '01000000011',
            'status' => UserStatus::Active,
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $trainer->assignRole(Role::Trainer->value);

        $staff = User::query()->create([
            'first_name' => 'Sara',
            'last_name' => 'Staff',
            'email' => 'staff@demo.academy',
            'phone' => '01000000012',
            'status' => UserStatus::Active,
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $staff->assignRole(Role::Staff->value);

        foreach ([$owner, $trainer, $staff] as $index => $member) {
            OrganizationUser::query()->create([
                'organization_id' => $organization->id,
                'user_id' => $member->id,
                'branch_id' => $branch->id,
                'is_owner' => $index === 0,
                'status' => 'active',
            ]);
        }

        $traineeUser = User::query()->create([
            'first_name' => 'Youssef',
            'last_name' => 'Trainee',
            'phone' => '01000000001',
            'email' => null,
            'gender' => Gender::Male,
            'date_of_birth' => '2012-05-01',
            'status' => UserStatus::Active,
            'password' => $password,
            'phone_verified_at' => now(),
        ]);
        $traineeUser->assignRole(Role::Trainee->value);
        OrganizationUser::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $traineeUser->id,
            'branch_id' => $branch->id,
            'status' => 'active',
        ]);

        $trainee = Trainee::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $traineeUser->id,
            'branch_id' => $branch->id,
            'code' => 'TR-001',
            'emergency_contact_name' => 'Parent Demo',
            'emergency_contact_phone' => '01000000002',
            'status' => 'active',
        ]);

        $parentUser = User::query()->create([
            'first_name' => 'Mona',
            'last_name' => 'Parent',
            'phone' => '01000000002',
            'email' => null,
            'status' => UserStatus::Active,
            'password' => $password,
            'phone_verified_at' => now(),
        ]);
        $parentUser->assignRole(Role::Parent->value);
        OrganizationUser::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $parentUser->id,
            'status' => 'active',
        ]);

        $parent = ParentProfile::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $parentUser->id,
            'status' => 'active',
        ]);
        $parent->trainees()->attach($trainee->id, ['relationship' => 'mother']);

        // Extra trainees for richer demo
        for ($i = 2; $i <= 5; $i++) {
            $u = User::query()->create([
                'first_name' => 'Trainee',
                'last_name' => (string) $i,
                'phone' => '0100000010'.$i,
                'status' => UserStatus::Active,
                'password' => $password,
                'phone_verified_at' => now(),
                'gender' => $i % 2 === 0 ? Gender::Female : Gender::Male,
            ]);
            $u->assignRole(Role::Trainee->value);
            OrganizationUser::query()->create([
                'organization_id' => $organization->id,
                'user_id' => $u->id,
                'branch_id' => $branch->id,
                'status' => 'active',
            ]);
            Trainee::query()->create([
                'organization_id' => $organization->id,
                'user_id' => $u->id,
                'branch_id' => $branch->id,
                'code' => 'TR-00'.$i,
                'status' => 'active',
            ]);
        }

        $packages = collect([
            ['name' => 'Starter 8', 'sessions_count' => 8, 'duration_days' => 30, 'price' => 800],
            ['name' => 'Standard 12', 'sessions_count' => 12, 'duration_days' => 45, 'price' => 1100],
            ['name' => 'Pro 20', 'sessions_count' => 20, 'duration_days' => 60, 'price' => 1700],
        ])->map(fn (array $data) => Package::query()->create([
            'organization_id' => $organization->id,
            ...$data,
            'currency' => 'EGP',
            'is_active' => true,
            'description' => $data['name'].' sessions package',
        ]));

        SkillCategory::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Technique',
            'sort_order' => 1,
        ]);
        SkillCategory::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Fitness',
            'sort_order' => 2,
        ]);

        /** @var SubscriptionService $subscriptionService */
        $subscriptionService = app(SubscriptionService::class);
        /** @var AttendanceService $attendanceService */
        $attendanceService = app(AttendanceService::class);

        $mainPackage = $packages->firstWhere('name', 'Standard 12');
        $subscription = $subscriptionService->createFromPackage($trainee, $mainPackage, now()->subDays(10), $owner);

        Payment::query()->create([
            'organization_id' => $organization->id,
            'subscription_id' => $subscription->id,
            'trainee_id' => $trainee->id,
            'amount' => $mainPackage->price,
            'currency' => 'EGP',
            'method' => PaymentMethod::Cash,
            'status' => PaymentStatus::Completed,
            'paid_at' => now()->subDays(10),
            'recorded_by' => $staff->id,
        ]);

        // Mark a few attendance days so remaining goes from 12 toward lower
        foreach ([9, 7, 5] as $daysAgo) {
            $attendanceService->mark(
                $trainee,
                $subscription->fresh(),
                AttendanceStatus::Present,
                now()->subDays($daysAgo),
                CheckInMethod::Manual,
                $trainer,
                $branch
            );
        }

        // Subscriptions for other trainees
        Trainee::query()
            ->where('organization_id', $organization->id)
            ->where('id', '!=', $trainee->id)
            ->get()
            ->each(function (Trainee $t) use ($packages, $subscriptionService, $owner, $organization, $staff) {
                $package = $packages->random();
                $sub = $subscriptionService->createFromPackage($t, $package, now()->subDays(3), $owner);
                Payment::query()->create([
                    'organization_id' => $organization->id,
                    'subscription_id' => $sub->id,
                    'trainee_id' => $t->id,
                    'amount' => $package->price,
                    'currency' => 'EGP',
                    'method' => PaymentMethod::Card,
                    'status' => PaymentStatus::Completed,
                    'paid_at' => now()->subDays(3),
                    'recorded_by' => $staff->id,
                ]);
            });

        CurrentOrganization::forget();
    }
}
