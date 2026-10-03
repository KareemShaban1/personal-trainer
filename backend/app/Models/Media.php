<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    protected $table = 'media';

    protected $fillable = [
        'organization_id',
        'model_type',
        'model_id',
        'collection',
        'file_name',
        'path',
        'mime_type',
        'size',
        'disk',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function model(): MorphTo
    {
        return $this->morphTo();
    }
}
