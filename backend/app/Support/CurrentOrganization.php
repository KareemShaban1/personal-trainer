<?php

namespace App\Support;

final class CurrentOrganization
{
    public static function id(): ?int
    {
        $id = app()->bound('currentOrganizationId')
            ? app('currentOrganizationId')
            : null;

        return $id !== null ? (int) $id : null;
    }

    public static function set(?int $organizationId): void
    {
        app()->instance('currentOrganizationId', $organizationId);
    }

    public static function forget(): void
    {
        app()->forgetInstance('currentOrganizationId');
    }

    public static function bypass(bool $bypass = true): void
    {
        app()->instance('bypassOrganizationScope', $bypass);
    }

    public static function shouldBypass(): bool
    {
        return (bool) (app()->bound('bypassOrganizationScope')
            ? app('bypassOrganizationScope')
            : false);
    }
}
