<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Package\StorePackageRequest;
use App\Http\Requests\Package\UpdatePackageRequest;
use App\Http\Resources\PackageResource;
use App\Models\Package;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Package::class);

        $packages = Package::query()
            ->when($request->boolean('active_only'), fn ($q) => $q->where('is_active', true))
            ->latest()
            ->paginate(20);

        return PackageResource::collection($packages)->response();
    }

    public function store(StorePackageRequest $request): JsonResponse
    {
        $this->authorize('create', Package::class);

        $package = Package::query()->create([
            ...$request->validated(),
            'organization_id' => CurrentOrganization::id(),
            'currency' => $request->input('currency', 'EGP'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'Package created.',
            'package' => new PackageResource($package),
        ], 201);
    }

    public function show(Package $package): JsonResponse
    {
        $this->authorize('view', $package);

        return response()->json(['package' => new PackageResource($package)]);
    }

    public function update(UpdatePackageRequest $request, Package $package): JsonResponse
    {
        $this->authorize('update', $package);
        $package->fill($request->validated())->save();

        return response()->json([
            'message' => 'Package updated.',
            'package' => new PackageResource($package),
        ]);
    }

    public function destroy(Package $package): JsonResponse
    {
        $this->authorize('delete', $package);
        $package->delete();

        return response()->json(['message' => 'Package deleted.']);
    }
}