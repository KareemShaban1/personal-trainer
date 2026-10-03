<?php

namespace App\Services;

use App\Enums\OrganizationStatus;
use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\Organization;
use App\Models\OrganizationSetting;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OrganizationRegistrationService
{
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $slugBase = Str::slug($data['organization_name']);
            $slug = $slugBase;
            $i = 1;
            while (Organization::query()->where('slug', $slug)->exists()) {
                $slug = $slugBase.'-'.$i++;
            }

            $organization = Organization::query()->create([
                'name' => $data['organization_name'],
                'slug' => $slug,
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'country' => $data['country'] ?? 'Egypt',
                'city' => $data['city'] ?? null,
                'timezone' => $data['timezone'] ?? 'Africa/Cairo',
                'currency' => $data['currency'] ?? 'EGP',
                'status' => OrganizationStatus::Trial,
                'trial_ends_at' => now()->addDays(14),
            ]);

            OrganizationSetting::query()->create([
                'organization_id' => $organization->id,
            ]);

            $owner = User::query()->create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => UserStatus::Active,
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);

            $owner->assignRole(Role::OrganizationOwner->value);

            OrganizationUser::query()->create([
                'organization_id' => $organization->id,
                'user_id' => $owner->id,
                'is_owner' => true,
                'status' => 'active',
            ]);

            $token = $owner->createToken('auth')->plainTextToken;

            return compact('organization', 'owner', 'token');
        });
    }
}
