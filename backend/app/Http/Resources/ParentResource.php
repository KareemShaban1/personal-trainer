<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ParentProfile */
class ParentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'status' => $this->status,
            'user' => new UserResource($this->whenLoaded('user')),
            'trainees' => TraineeResource::collection($this->whenLoaded('trainees')),
            'created_at' => $this->created_at,
        ];
    }
}
