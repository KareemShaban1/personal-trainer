<?php

namespace App\Policies;

use App\Models\ProgressRecord;
use App\Models\User;
use App\Policies\Concerns\ChecksOrganizationAccess;

class ProgressRecordPolicy
{
    use ChecksOrganizationAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrgStaff($user) || $user->hasAnyRole(['trainee', 'parent']);
    }

    public function view(User $user, ProgressRecord $model): bool
    {
        return $this->sameOrganization($user, $model);
    }

    public function create(User $user): bool
    {
        return $this->isOrgStaff($user);
    }

    public function update(User $user, ProgressRecord $model): bool
    {
        return $this->isOrgStaff($user) && $this->sameOrganization($user, $model);
    }

    public function delete(User $user, ProgressRecord $model): bool
    {
        return $this->isOrgManager($user) && $this->sameOrganization($user, $model);
    }
}