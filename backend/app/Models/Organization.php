<?php

namespace App\Models;

use App\Enums\OrganizationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'country',
        'city',
        'timezone',
        'currency',
        'status',
        'logo',
        'trial_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrganizationStatus::class,
            'trial_ends_at' => 'datetime',
        ];
    }

    public function settings(): HasOne
    {
        return $this->hasOne(OrganizationSetting::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_users')
            ->withPivot(['branch_id', 'is_owner', 'status'])
            ->withTimestamps();
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function trainees(): HasMany
    {
        return $this->hasMany(Trainee::class);
    }

    public function parents(): HasMany
    {
        return $this->hasMany(ParentProfile::class);
    }

    public function packages(): HasMany
    {
        return $this->hasMany(Package::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}
