<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Parent\StoreParentRequest;
use App\Http\Requests\Parent\UpdateParentRequest;
use App\Http\Resources\ParentResource;
use App\Models\ParentProfile;
use App\Models\User;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ParentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ParentProfile::class);

        $parents = ParentProfile::query()
            ->with(['user', 'trainees.user'])
            ->latest()
            ->paginate(20);

        return ParentResource::collection($parents)->response();
    }

    public function store(StoreParentRequest $request): JsonResponse
    {
        $this->authorize('create', ParentProfile::class);

        $parent = DB::transaction(function () use ($request) {
            $user = User::query()->create([
                'first_name' => $request->string('first_name'),
                'last_name' => $request->string('last_name'),
                'phone' => $request->string('phone'),
                'email' => $request->input('email'),
                'status' => UserStatus::Active,
                'password' => Hash::make($request->string('password')),
                'phone_verified_at' => now(),
            ]);
            $user->assignRole(Role::Parent->value);
            $user->organizations()->attach(CurrentOrganization::id(), ['status' => 'active']);

            $parent = ParentProfile::query()->create([
                'organization_id' => CurrentOrganization::id(),
                'user_id' => $user->id,
                'status' => 'active',
            ]);

            if ($request->filled('trainee_ids')) {
                $parent->trainees()->sync($request->input('trainee_ids'));
            }

            return $parent->load(['user', 'trainees.user']);
        });

        return response()->json([
            'message' => 'Parent created.',
            'parent' => new ParentResource($parent),
        ], 201);
    }

    public function show(ParentProfile $parent): JsonResponse
    {
        $this->authorize('view', $parent);

        return response()->json([
            'parent' => new ParentResource($parent->load(['user', 'trainees.user'])),
        ]);
    }

    public function update(UpdateParentRequest $request, ParentProfile $parent): JsonResponse
    {
        $this->authorize('update', $parent);

        DB::transaction(function () use ($request, $parent) {
            $userData = collect($request->validated())->only(['first_name', 'last_name'])->all();
            if ($userData !== []) {
                $parent->user->fill($userData)->save();
            }

            if ($request->filled('status')) {
                $parent->status = $request->string('status');
                $parent->save();
            }

            if ($request->has('trainee_ids')) {
                $parent->trainees()->sync($request->input('trainee_ids', []));
            }
        });

        return response()->json([
            'message' => 'Parent updated.',
            'parent' => new ParentResource($parent->fresh()->load(['user', 'trainees.user'])),
        ]);
    }

    public function destroy(ParentProfile $parent): JsonResponse
    {
        $this->authorize('delete', $parent);
        $parent->delete();

        return response()->json(['message' => 'Parent deleted.']);
    }
}