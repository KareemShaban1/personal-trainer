<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PackageResource;
use App\Http\Resources\TraineeResource;
use App\Models\Package;
use App\Models\Trainee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (strlen($q) < 2) {
            return response()->json(['trainees' => [], 'packages' => []]);
        }

        $trainees = Trainee::query()
            ->with('user')
            ->whereHas('user', function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            })
            ->orWhere('code', 'like', "%{$q}%")
            ->limit(10)
            ->get();

        $packages = Package::query()
            ->where('name', 'like', "%{$q}%")
            ->limit(10)
            ->get();

        return response()->json([
            'trainees' => TraineeResource::collection($trainees),
            'packages' => PackageResource::collection($packages),
        ]);
    }
}