<?php

namespace App\Models;

use App\Enums\Gender;
use App\Enums\Role;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'avatar',
        'status',
        'phone_verified_at',
        'email_verified_at',
        'bio',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'date_of_birth' => 'date',
            'password' => 'hashed',
            'gender' => Gender::class,
            'status' => UserStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            $user->name = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));
        });
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_users')
            ->withPivot(['branch_id', 'is_owner', 'status'])
            ->withTimestamps();
    }

    public function organizationMemberships(): HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    public function traineeProfile(): HasOne
    {
        return $this->hasOne(Trainee::class);
    }

    public function parentProfile(): HasOne
    {
        return $this->hasOne(ParentProfile::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(Role::SuperAdmin->value);
    }

    public function usesPhoneLogin(): bool
    {
        return $this->hasAnyRole([
            Role::Trainee->value,
            Role::Parent->value,
        ]);
    }

    public function loginIdentifier(): ?string
    {
        return $this->usesPhoneLogin() ? $this->phone : $this->email;
    }
}
