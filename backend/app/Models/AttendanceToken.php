<?php

namespace App\Models;

use App\Enums\AttendanceTokenType;
use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AttendanceToken extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'token',
        'type',
        'tokenable_type',
        'tokenable_id',
        'expires_at',
        'used_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'type' => AttendanceTokenType::class,
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function tokenable(): MorphTo
    {
        return $this->morphTo();
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }
}
