<?php

namespace App\Traits;

use App\Models\Organization;
use App\Support\CurrentOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @mixin Model
 */
trait BelongsToOrganization
{
    public static function bootBelongsToOrganization(): void
    {
        static::creating(function (Model $model): void {
            if (empty($model->getAttribute('organization_id')) && CurrentOrganization::id()) {
                $model->setAttribute('organization_id', CurrentOrganization::id());
            }
        });

        static::addGlobalScope('organization', function (Builder $builder): void {
            if (CurrentOrganization::shouldBypass()) {
                return;
            }

            $organizationId = CurrentOrganization::id();

            if ($organizationId !== null) {
                $builder->where(
                    $builder->getModel()->getTable().'.organization_id',
                    $organizationId
                );
            }
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
