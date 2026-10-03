<?php

namespace App\Models;

use App\Enums\NoteVisibility;
use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Note extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'notable_type',
        'notable_id',
        'author_id',
        'body',
        'visibility',
    ];

    protected function casts(): array
    {
        return [
            'visibility' => NoteVisibility::class,
        ];
    }

    public function notable(): MorphTo
    {
        return $this->morphTo();
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
