<?php

namespace Database\Seeders;

use App\Enums\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role as SpatieRole;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'organizations.manage',
            'trainees.manage',
            'parents.manage',
            'packages.manage',
            'subscriptions.manage',
            'payments.manage',
            'attendance.manage',
            'progress.manage',
            'notes.manage',
            'reports.view',
            'platform.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (Role::cases() as $role) {
            SpatieRole::findOrCreate($role->value, 'web');
        }

        SpatieRole::findByName(Role::SuperAdmin->value)
            ->syncPermissions(Permission::all());

        SpatieRole::findByName(Role::OrganizationOwner->value)
            ->syncPermissions([
                'organizations.manage',
                'trainees.manage',
                'parents.manage',
                'packages.manage',
                'subscriptions.manage',
                'payments.manage',
                'attendance.manage',
                'progress.manage',
                'notes.manage',
                'reports.view',
            ]);

        SpatieRole::findByName(Role::Trainer->value)
            ->syncPermissions([
                'trainees.manage',
                'attendance.manage',
                'progress.manage',
                'notes.manage',
                'reports.view',
            ]);

        SpatieRole::findByName(Role::Staff->value)
            ->syncPermissions([
                'trainees.manage',
                'parents.manage',
                'subscriptions.manage',
                'payments.manage',
                'attendance.manage',
                'notes.manage',
            ]);
    }
}
