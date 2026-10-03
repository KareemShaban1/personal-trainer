<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgressSkill extends Model
{
    protected $fillable = [
        'progress_record_id',
        'skill_category_id',
        'skill_name',
        'rating',
        'notes',
    ];

    public function progressRecord(): BelongsTo
    {
        return $this->belongsTo(ProgressRecord::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class, 'skill_category_id');
    }
}
