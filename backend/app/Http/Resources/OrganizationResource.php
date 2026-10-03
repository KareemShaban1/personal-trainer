<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Organization */
class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'city' => $this->city,
            'timezone' => $this->timezone,
            'currency' => $this->currency,
            'status' => $this->status?->value,
            'logo' => $this->logo,
            'trial_ends_at' => $this->trial_ends_at,
            'settings' => $this->whenLoaded('settings'),
            'stats' => $this->when(
                $this->trainees_count !== null
                    || $this->trainers_count !== null
                    || $this->users_count !== null,
                fn () => [
                    'users_count' => (int) ($this->users_count ?? 0),
                    'owners_count' => (int) ($this->owners_count ?? 0),
                    'trainers_count' => (int) ($this->trainers_count ?? 0),
                    'staff_count' => (int) ($this->staff_count ?? 0),
                    'trainees_count' => (int) ($this->trainees_count ?? 0),
                    'parents_count' => (int) ($this->parents_count ?? 0),
                    'branches_count' => (int) ($this->branches_count ?? 0),
                    'packages_count' => (int) ($this->packages_count ?? 0),
                    'subscriptions_count' => (int) ($this->subscriptions_count ?? 0),
                    'active_subscriptions_count' => (int) ($this->active_subscriptions_count ?? 0),
                    'payments_count' => (int) ($this->payments_count ?? 0),
                    'attendance_count' => (int) ($this->attendance_records_count ?? 0),
                ],
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
