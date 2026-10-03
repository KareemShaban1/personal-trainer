<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ParentProfile extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $table = 'parents';

    protected $fillable = [
        'organization_id',
        'user_id',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trainees(): BelongsToMany
    {
        return $this->belongsToMany(Trainee::class, 'parent_trainee', 'parent_id', 'trainee_id')
            ->withPivot('relationship')
            ->withTimestamps();
    }
}
