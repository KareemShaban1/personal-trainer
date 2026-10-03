<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Trainee */
class TraineeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'code' => $this->code,
            'status' => $this->status,
            'branch_id' => $this->branch_id,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'medical_notes' => $this->medical_notes,
            'user' => new UserResource($this->whenLoaded('user')),
            'subscriptions' => SubscriptionResource::collection($this->whenLoaded('subscriptions')),
            'parents' => ParentResource::collection($this->whenLoaded('parents')),
            'created_at' => $this->created_at,
        ];
    }
}
