<?php

namespace App\Policies;

use App\Models\ParentProfile;
use App\Models\User;
use App\Policies\Concerns\ChecksOrganizationAccess;

class ParentProfilePolicy
{
    use ChecksOrganizationAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrgStaff($user) || $user->hasAnyRole(['trainee', 'parent']);
    }

    public function view(User $user, ParentProfile $model): bool
    {
        return $this->sameOrganization($user, $model);
    }

    public function create(User $user): bool
    {
        return $this->isOrgStaff($user);
    }

    public function update(User $user, ParentProfile $model): bool
    {
        return $this->isOrgStaff($user) && $this->sameOrganization($user, $model);
    }

    public function delete(User $user, ParentProfile $model): bool
    {
        return $this->isOrgManager($user) && $this->sameOrganization($user, $model);
    }
}