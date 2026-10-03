<?php

namespace App\Models;

use App\Enums\AttendanceStatus;
use App\Enums\CheckInMethod;
use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'trainee_id',
        'subscription_id',
        'branch_id',
        'status',
        'attendance_date',
        'checked_in_at',
        'check_in_method',
        'latitude',
        'longitude',
        'recorded_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => AttendanceStatus::class,
            'check_in_method' => CheckInMethod::class,
            'attendance_date' => 'date',
            'checked_in_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function trainee(): BelongsTo
    {
        return $this->belongsTo(Trainee::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
