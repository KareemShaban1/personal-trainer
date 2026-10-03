<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Enums\OrganizationStatus;
use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        CurrentOrganization::bypass(true);

        $orgs = Organization::query()
            ->with('settings')
            ->withCount($this->statCounts())
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = $request->string('q');
                $q->where(function ($inner) use ($term) {
                    $inner->where('name', 'like', "%{$term}%")
                        ->orWhere('slug', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                });
            })
            ->latest()
            ->paginate(min(100, max(1, (int) $request->integer('per_page', 20))));

        return OrganizationResource::collection($orgs)->response();
    }

    public function show(Request $request, Organization $organization): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);
        CurrentOrganization::bypass(true);

        $organization->load('settings')->loadCount($this->statCounts());

        return response()->json([
            'organization' => new OrganizationResource($organization),
        ]);
    }

    public function updateStatus(Request $request, Organization $organization): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $request->validate([
            'status' => ['required', 'in:active,inactive,suspended,trial'],
        ]);

        CurrentOrganization::bypass(true);
        $organization->status = OrganizationStatus::from($request->string('status'));
        $organization->save();
        $organization->loadCount($this->statCounts());

        return response()->json([
            'message' => 'Organization status updated.',
            'organization' => new OrganizationResource($organization),
        ]);
    }

    /** @return array<int|string, mixed> */
    private function statCounts(): array
    {
        return [
            'users',
            'users as owners_count' => fn ($q) => $q->role(Role::OrganizationOwner->value),
            'users as trainers_count' => fn ($q) => $q->role(Role::Trainer->value),
            'users as staff_count' => fn ($q) => $q->role(Role::Staff->value),
            'trainees',
            'parents',
            'branches',
            'packages',
            'subscriptions',
            'subscriptions as active_subscriptions_count' => fn ($q) => $q->where(
                'status',
                SubscriptionStatus::Active->value,
            ),
            'payments',
            'attendanceRecords',
        ];
    }
}
