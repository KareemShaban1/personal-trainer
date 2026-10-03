<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Trainee\StoreTraineeRequest;
use App\Http\Requests\Trainee\UpdateTraineeRequest;
use App\Http\Resources\TraineeResource;
use App\Models\Trainee;
use App\Models\User;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TraineeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Trainee::class);

        $query = Trainee::query()->with(['user', 'subscriptions.package']);

        if ($request->user()->hasRole(Role::Parent->value)) {
            $parent = $request->user()->parentProfile;
            $traineeIds = $parent?->trainees()->pluck('trainees.id') ?? collect();
            $query->whereIn('id', $traineeIds);
        } elseif ($request->user()->hasRole(Role::Trainee->value)) {
            $query->where('user_id', $request->user()->id);
        }

        if ($search = $request->string('q')->toString()) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->integer('per_page', 20), 1), 200);

        return TraineeResource::collection($query->latest()->paginate($perPage))->response();
    }

    public function store(StoreTraineeRequest $request): JsonResponse
    {
        $this->authorize('create', Trainee::class);

        $trainee = DB::transaction(function () use ($request) {
            $user = User::query()->create([
                'first_name' => $request->string('first_name'),
                'last_name' => $request->string('last_name'),
                'phone' => $request->string('phone'),
                'email' => $request->input('email'),
                'gender' => $request->input('gender'),
                'date_of_birth' => $request->input('date_of_birth'),
                'status' => UserStatus::Active,
                'password' => Hash::make($request->string('password')),
                'phone_verified_at' => now(),
            ]);
            $user->assignRole(Role::Trainee->value);

            $user->organizations()->attach(CurrentOrganization::id(), [
                'status' => 'active',
            ]);

            $trainee = Trainee::query()->create([
                'organization_id' => CurrentOrganization::id(),
                'user_id' => $user->id,
                'branch_id' => $request->input('branch_id'),
                'code' => $request->input('code'),
                'emergency_contact_name' => $request->input('emergency_contact_name'),
                'emergency_contact_phone' => $request->input('emergency_contact_phone'),
                'medical_notes' => $request->input('medical_notes'),
                'status' => 'active',
            ]);

            if ($request->filled('parent_ids')) {
                $trainee->parents()->sync($request->input('parent_ids'));
            }

            return $trainee->load(['user', 'parents.user']);
        });

        return response()->json([
            'message' => 'Trainee created.',
            'trainee' => new TraineeResource($trainee),
        ], 201);
    }

    public function show(Trainee $trainee): JsonResponse
    {
        $this->authorize('view', $trainee);

        return response()->json([
            'trainee' => new TraineeResource($trainee->load(['user', 'subscriptions.package', 'parents.user'])),
        ]);
    }

    public function update(UpdateTraineeRequest $request, Trainee $trainee): JsonResponse
    {
        $this->authorize('update', $trainee);

        DB::transaction(function () use ($request, $trainee) {
            $userData = collect($request->validated())->only(['first_name', 'last_name', 'gender', 'date_of_birth'])->all();
            if ($userData !== []) {
                $trainee->user->fill($userData)->save();
            }

            $trainee->fill(collect($request->validated())->only([
                'branch_id', 'code', 'emergency_contact_name', 'emergency_contact_phone', 'medical_notes', 'status',
            ])->all());
            $trainee->save();

            if ($request->has('parent_ids')) {
                $trainee->parents()->sync($request->input('parent_ids', []));
            }
        });

        return response()->json([
            'message' => 'Trainee updated.',
            'trainee' => new TraineeResource($trainee->fresh()->load(['user', 'parents.user'])),
        ]);
    }

    public function destroy(Trainee $trainee): JsonResponse
    {
        $this->authorize('delete', $trainee);
        $trainee->delete();

        return response()->json(['message' => 'Trainee deleted.']);
    }
}