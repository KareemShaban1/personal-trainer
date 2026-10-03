<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Note */
class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'notable_type' => $this->notable_type,
            'notable_id' => $this->notable_id,
            'body' => $this->body,
            'visibility' => $this->visibility?->value,
            'author' => new UserResource($this->whenLoaded('author')),
            'created_at' => $this->created_at,
        ];
    }
}
