<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use App\Policies\Concerns\ChecksOrganizationAccess;

class OrganizationPolicy
{
    use ChecksOrganizationAccess;

    public function view(User $user, Organization $organization): bool
    {
        return $user->isSuperAdmin()
            || $user->organizations()->where('organizations.id', $organization->id)->exists();
    }

    public function update(User $user, Organization $organization): bool
    {
        return $user->isSuperAdmin()
            || ($this->isOrgManager($user)
                && $user->organizations()->where('organizations.id', $organization->id)->exists());
    }

    public function viewReports(User $user): bool
    {
        return $this->isOrgStaff($user);
    }
}