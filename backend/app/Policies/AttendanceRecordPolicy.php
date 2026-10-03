<?php

namespace App\Policies;

use App\Models\AttendanceRecord;
use App\Models\User;
use App\Policies\Concerns\ChecksOrganizationAccess;

class AttendanceRecordPolicy
{
    use ChecksOrganizationAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrgStaff($user) || $user->hasAnyRole(['trainee', 'parent']);
    }

    public function view(User $user, AttendanceRecord $model): bool
    {
        return $this->sameOrganization($user, $model);
    }

    public function create(User $user): bool
    {
        return $this->isOrgStaff($user);
    }

    public function update(User $user, AttendanceRecord $model): bool
    {
        return $this->isOrgStaff($user) && $this->sameOrganization($user, $model);
    }

    public function delete(User $user, AttendanceRecord $model): bool
    {
        return $this->isOrgManager($user) && $this->sameOrganization($user, $model);
    }
}