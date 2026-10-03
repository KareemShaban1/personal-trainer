<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AttendanceRecord */
class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trainee_id' => $this->trainee_id,
            'subscription_id' => $this->subscription_id,
            'branch_id' => $this->branch_id,
            'status' => $this->status?->value,
            'attendance_date' => $this->attendance_date?->toDateString(),
            'checked_in_at' => $this->checked_in_at,
            'check_in_method' => $this->check_in_method?->value,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'notes' => $this->notes,
            'trainee' => new TraineeResource($this->whenLoaded('trainee')),
            'subscription' => new SubscriptionResource($this->whenLoaded('subscription')),
            'created_at' => $this->created_at,
        ];
    }
}
