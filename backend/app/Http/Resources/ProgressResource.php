<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ProgressRecord */
class ProgressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trainee_id' => $this->trainee_id,
            'notes' => $this->notes,
            'recorded_at' => $this->recorded_at,
            'skills' => $this->whenLoaded('skills'),
            'trainee' => new TraineeResource($this->whenLoaded('trainee')),
            'created_at' => $this->created_at,
        ];
    }
}
