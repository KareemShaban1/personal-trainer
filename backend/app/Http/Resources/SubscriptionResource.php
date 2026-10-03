<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Subscription */
class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trainee_id' => $this->trainee_id,
            'package_id' => $this->package_id,
            'status' => $this->status?->value,
            'started_at' => $this->started_at?->toDateString(),
            'ends_at' => $this->ends_at?->toDateString(),
            'remaining_sessions' => $this->remaining_sessions,
            'notes' => $this->notes,
            'trainee' => new TraineeResource($this->whenLoaded('trainee')),
            'package' => new PackageResource($this->whenLoaded('package')),
            'created_at' => $this->created_at,
        ];
    }
}
