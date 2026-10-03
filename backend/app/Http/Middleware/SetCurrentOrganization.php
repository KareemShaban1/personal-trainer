<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use App\Models\Organization;
use App\Support\CurrentOrganization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentOrganization
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->hasRole(Role::SuperAdmin->value)) {
            $headerOrgId = $request->header('X-Organization-Id');

            if ($headerOrgId) {
                CurrentOrganization::set((int) $headerOrgId);
            } else {
                CurrentOrganization::bypass(true);
            }

            return $next($request);
        }

        $organizationId = $this->resolveOrganizationId($request, $user);

        if (! $organizationId) {
            return response()->json([
                'message' => 'No organization context available.',
            ], 403);
        }

        $belongs = $user->organizations()
            ->where('organizations.id', $organizationId)
            ->exists();

        if (! $belongs) {
            return response()->json([
                'message' => 'You do not belong to this organization.',
            ], 403);
        }

        CurrentOrganization::set($organizationId);
        $request->attributes->set('organization_id', $organizationId);

        return $next($request);
    }

    private function resolveOrganizationId(Request $request, $user): ?int
    {
        $headerOrgId = $request->header('X-Organization-Id');

        if ($headerOrgId) {
            return (int) $headerOrgId;
        }

        $membership = $user->organizations()->first();

        return $membership?->id;
    }
}
