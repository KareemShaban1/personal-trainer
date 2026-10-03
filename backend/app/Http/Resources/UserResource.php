<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender?->value,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'avatar' => $this->avatar,
            'status' => $this->status?->value,
            'bio' => $this->bio,
            'roles' => $this->whenLoaded('roles', fn () => $this->getRoleNames()),
            'organizations' => $this->whenLoaded('organizations', fn () => OrganizationResource::collection($this->organizations)),
            'created_at' => $this->created_at,
        ];
    }
}
