<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;
use App\Policies\Concerns\ChecksOrganizationAccess;

class SubscriptionPolicy
{
    use ChecksOrganizationAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrgStaff($user) || $user->hasAnyRole(['trainee', 'parent']);
    }

    public function view(User $user, Subscription $model): bool
    {
        return $this->sameOrganization($user, $model);
    }

    public function create(User $user): bool
    {
        return $this->isOrgStaff($user);
    }

    public function update(User $user, Subscription $model): bool
    {
        return $this->isOrgStaff($user) && $this->sameOrganization($user, $model);
    }

    public function delete(User $user, Subscription $model): bool
    {
        return $this->isOrgManager($user) && $this->sameOrganization($user, $model);
    }
}