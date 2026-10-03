<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Progress\StoreProgressRequest;
use App\Http\Resources\ProgressResource;
use App\Models\ProgressRecord;
use App\Models\Trainee;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ProgressRecord::class);

        $query = ProgressRecord::query()->with(['trainee.user', 'skills']);

        if ($request->user()->hasRole(Role::Parent->value)) {
            $ids = $request->user()->parentProfile?->trainees()->pluck('trainees.id') ?? collect();
            $query->whereIn('trainee_id', $ids);
        } elseif ($request->user()->hasRole(Role::Trainee->value)) {
            $query->where('trainee_id', $request->user()->traineeProfile?->id);
        }

        if ($request->filled('trainee_id')) {
            $query->where('trainee_id', $request->integer('trainee_id'));
        }

        return ProgressResource::collection($query->latest('recorded_at')->paginate(20))->response();
    }

    public function store(StoreProgressRequest $request): JsonResponse
    {
        $this->authorize('create', ProgressRecord::class);

        $record = DB::transaction(function () use ($request) {
            Trainee::query()->findOrFail($request->integer('trainee_id'));

            $record = ProgressRecord::query()->create([
                'organization_id' => CurrentOrganization::id(),
                'trainee_id' => $request->integer('trainee_id'),
                'recorded_by' => $request->user()->id,
                'notes' => $request->input('notes'),
                'recorded_at' => $request->input('recorded_at', now()),
            ]);

            foreach ($request->input('skills', []) as $skill) {
                $record->skills()->create($skill);
            }

            return $record->load(['trainee.user', 'skills']);
        });

        return response()->json([
            'message' => 'Progress recorded.',
            'progress' => new ProgressResource($record),
        ], 201);
    }

    public function show(ProgressRecord $progress): JsonResponse
    {
        $this->authorize('view', $progress);

        return response()->json([
            'progress' => new ProgressResource($progress->load(['trainee.user', 'skills'])),
        ]);
    }
}