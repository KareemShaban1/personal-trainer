<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationSetting extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'check_in_radius_meters',
        'require_geolocation',
        'attendance_qr_ttl_seconds',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'require_geolocation' => 'boolean',
            'settings' => 'array',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
