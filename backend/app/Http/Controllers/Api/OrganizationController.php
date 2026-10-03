<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Organization\UpdateOrganizationRequest;
use App\Http\Requests\Organization\UpdateSettingsRequest;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Models\OrganizationSetting;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;

class OrganizationController extends Controller
{
    public function show(): JsonResponse
    {
        $organization = Organization::query()
            ->with('settings')
            ->findOrFail(CurrentOrganization::id());

        $this->authorize('view', $organization);

        return response()->json([
            'organization' => new OrganizationResource($organization),
        ]);
    }

    public function update(UpdateOrganizationRequest $request): JsonResponse
    {
        $organization = Organization::query()->findOrFail(CurrentOrganization::id());
        $this->authorize('update', $organization);

        $organization->fill($request->validated());
        $organization->save();

        return response()->json([
            'message' => 'Organization updated.',
            'organization' => new OrganizationResource($organization->fresh('settings')),
        ]);
    }

    public function settings(): JsonResponse
    {
        $settings = OrganizationSetting::query()
            ->firstOrCreate(['organization_id' => CurrentOrganization::id()]);

        return response()->json(['settings' => $settings]);
    }

    public function updateSettings(UpdateSettingsRequest $request): JsonResponse
    {
        $organization = Organization::query()->findOrFail(CurrentOrganization::id());
        $this->authorize('update', $organization);

        $settings = OrganizationSetting::query()
            ->firstOrCreate(['organization_id' => $organization->id]);

        $settings->fill($request->validated());
        $settings->save();

        return response()->json([
            'message' => 'Settings updated.',
            'settings' => $settings,
        ]);
    }
}