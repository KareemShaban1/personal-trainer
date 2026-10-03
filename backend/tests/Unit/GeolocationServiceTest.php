<?php

use App\Services\GeolocationService;

it('calculates haversine distance and radius membership', function () {
    $geo = new GeolocationService;

    expect($geo->distanceInMeters(30.0, 31.0, 30.0, 31.0))->toBeLessThan(1.0);

    $distance = $geo->distanceInMeters(30.0, 31.0, 30.001, 31.0);
    expect($distance)->toBeGreaterThan(100)->toBeLessThan(130);

    expect($geo->isWithinRadius(30.0, 31.0, 30.0005, 31.0, 100))->toBeTrue();
    expect($geo->isWithinRadius(30.0, 31.0, 30.01, 31.0, 100))->toBeFalse();
});
