<?php

namespace App\Policies\Concerns;

use App\Enums\Role;
use App\Models\User;

trait ChecksOrganizationAccess
{
    protected function isOrgStaff(User $user): bool
    {
        return $user->hasAnyRole([
            Role::OrganizationOwner->value,
            Role::Trainer->value,
            Role::Staff->value,
            Role::SuperAdmin->value,
        ]);
    }

    protected function isOrgManager(User $user): bool
    {
        return $user->hasAnyRole([
            Role::OrganizationOwner->value,
            Role::SuperAdmin->value,
        ]);
    }

    protected function sameOrganization(User $user, $model): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if (! isset($model->organization_id)) {
            return false;
        }

        return $user->organizations()->where('organizations.id', $model->organization_id)->exists();
    }
}