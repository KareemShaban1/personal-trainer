<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Trainee;
use App\Models\User;
use App\Policies\Concerns\ChecksOrganizationAccess;

class TraineePolicy
{
    use ChecksOrganizationAccess;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Trainee $trainee): bool
    {
        if (! $this->sameOrganization($user, $trainee)) {
            return false;
        }

        if ($this->isOrgStaff($user)) {
            return true;
        }

        if ($user->hasRole(Role::Trainee->value)) {
            return $trainee->user_id === $user->id;
        }

        if ($user->hasRole(Role::Parent->value)) {
            return $user->parentProfile
                ? $user->parentProfile->trainees()->where('trainees.id', $trainee->id)->exists()
                : false;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->isOrgStaff($user);
    }

    public function update(User $user, Trainee $trainee): bool
    {
        return $this->isOrgStaff($user) && $this->sameOrganization($user, $trainee);
    }

    public function delete(User $user, Trainee $trainee): bool
    {
        return $this->isOrgManager($user) && $this->sameOrganization($user, $trainee);
    }
}