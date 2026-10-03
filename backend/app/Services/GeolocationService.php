<?php

namespace App\Services;

class GeolocationService
{
    /**
     * Haversine distance in meters between two lat/lng points.
     */
    public function distanceInMeters(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2
    ): float {
        $earthRadius = 6371000;

        $latFrom = deg2rad($lat1);
        $lngFrom = deg2rad($lng1);
        $latTo = deg2rad($lat2);
        $lngTo = deg2rad($lng2);

        $latDelta = $latTo - $latFrom;
        $lngDelta = $lngTo - $lngFrom;

        $a = sin($latDelta / 2) ** 2
            + cos($latFrom) * cos($latTo) * sin($lngDelta / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function isWithinRadius(
        float $centerLat,
        float $centerLng,
        float $pointLat,
        float $pointLng,
        float $radiusMeters
    ): bool {
        return $this->distanceInMeters($centerLat, $centerLng, $pointLat, $pointLng) <= $radiusMeters;
    }
}
