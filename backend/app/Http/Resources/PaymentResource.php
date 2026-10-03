<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subscription_id' => $this->subscription_id,
            'trainee_id' => $this->trainee_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'method' => $this->method?->value,
            'status' => $this->status?->value,
            'paid_at' => $this->paid_at,
            'reference' => $this->reference,
            'notes' => $this->notes,
            'trainee' => new TraineeResource($this->whenLoaded('trainee')),
            'created_at' => $this->created_at,
        ];
    }
}
