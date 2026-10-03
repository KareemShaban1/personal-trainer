<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;
use App\Policies\Concerns\ChecksOrganizationAccess;

class PaymentPolicy
{
    use ChecksOrganizationAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrgStaff($user) || $user->hasAnyRole(['trainee', 'parent']);
    }

    public function view(User $user, Payment $model): bool
    {
        return $this->sameOrganization($user, $model);
    }

    public function create(User $user): bool
    {
        return $this->isOrgStaff($user);
    }

    public function update(User $user, Payment $model): bool
    {
        return $this->isOrgStaff($user) && $this->sameOrganization($user, $model);
    }

    public function delete(User $user, Payment $model): bool
    {
        return $this->isOrgManager($user) && $this->sameOrganization($user, $model);
    }
}