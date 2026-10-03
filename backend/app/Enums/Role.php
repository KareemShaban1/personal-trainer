<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'super_admin';
    case OrganizationOwner = 'organization_owner';
    case Trainer = 'trainer';
    case Staff = 'staff';
    case Trainee = 'trainee';
    case Parent = 'parent';

    public function isStaff(): bool
    {
        return in_array($this, [
            self::SuperAdmin,
            self::OrganizationOwner,
            self::Trainer,
            self::Staff,
        ], true);
    }

    public function usesEmailLogin(): bool
    {
        return $this->isStaff();
    }
}
