<?php

namespace App\Http\Controllers\Api;

use App\Enums\NoteVisibility;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Note\StoreNoteRequest;
use App\Http\Resources\NoteResource;
use App\Models\Note;
use App\Models\Trainee;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Note::class);

        $query = Note::query()->with('author')->latest();

        if ($request->user()->hasRole(Role::Parent->value)) {
            $ids = $request->user()->parentProfile?->trainees()->pluck('trainees.id') ?? collect();
            $query->where('notable_type', Trainee::class)
                ->whereIn('notable_id', $ids)
                ->where('visibility', NoteVisibility::SharedWithParent);
        }

        if ($request->filled('notable_type') && $request->filled('notable_id')) {
            $query->where('notable_type', $request->string('notable_type'))
                ->where('notable_id', $request->integer('notable_id'));
        }

        return NoteResource::collection($query->paginate(20))->response();
    }

    public function store(StoreNoteRequest $request): JsonResponse
    {
        $this->authorize('create', Note::class);

        $note = Note::query()->create([
            'organization_id' => CurrentOrganization::id(),
            'notable_type' => $request->string('notable_type'),
            'notable_id' => $request->integer('notable_id'),
            'author_id' => $request->user()->id,
            'body' => $request->string('body'),
            'visibility' => $request->input('visibility', NoteVisibility::Internal->value),
        ]);

        return response()->json([
            'message' => 'Note created.',
            'note' => new NoteResource($note->load('author')),
        ], 201);
    }

    public function destroy(Note $note): JsonResponse
    {
        $this->authorize('delete', $note);
        $note->delete();

        return response()->json(['message' => 'Note deleted.']);
    }
}