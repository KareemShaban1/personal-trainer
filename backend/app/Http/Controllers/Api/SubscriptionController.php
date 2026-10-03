<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\StoreSubscriptionRequest;
use App\Http\Requests\Subscription\UpdateSubscriptionStatusRequest;
use App\Http\Resources\SubscriptionResource;
use App\Models\Package;
use App\Models\Subscription;
use App\Models\Trainee;
use App\Services\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptionService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Subscription::class);

        $query = Subscription::query()->with(['trainee.user', 'package']);

        if ($request->filled('trainee_id')) {
            $query->where('trainee_id', $request->integer('trainee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return SubscriptionResource::collection($query->latest()->paginate(20))->response();
    }

    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        $this->authorize('create', Subscription::class);

        $trainee = Trainee::query()->findOrFail($request->integer('trainee_id'));
        $package = Package::query()->findOrFail($request->integer('package_id'));

        $subscription = $this->subscriptionService->createFromPackage(
            $trainee,
            $package,
            $request->filled('started_at') ? Carbon::parse($request->input('started_at')) : null,
            $request->user(),
            $request->input('notes')
        );

        return response()->json([
            'message' => 'Subscription created.',
            'subscription' => new SubscriptionResource($subscription),
        ], 201);
    }

    public function show(Subscription $subscription): JsonResponse
    {
        $this->authorize('view', $subscription);

        return response()->json([
            'subscription' => new SubscriptionResource($subscription->load(['trainee.user', 'package', 'transactions'])),
        ]);
    }

    public function cancel(UpdateSubscriptionStatusRequest $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('update', $subscription);

        $subscription = $this->subscriptionService->cancel(
            $subscription,
            $request->user(),
            $request->input('reason')
        );

        return response()->json([
            'message' => 'Subscription cancelled.',
            'subscription' => new SubscriptionResource($subscription),
        ]);
    }

    public function suspend(UpdateSubscriptionStatusRequest $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('update', $subscription);

        $subscription = $this->subscriptionService->suspend(
            $subscription,
            $request->user(),
            $request->input('reason')
        );

        return response()->json([
            'message' => 'Subscription suspended.',
            'subscription' => new SubscriptionResource($subscription),
        ]);
    }

    public function resume(UpdateSubscriptionStatusRequest $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('update', $subscription);

        $subscription = $this->subscriptionService->resume($subscription, $request->user());

        return response()->json([
            'message' => 'Subscription resumed.',
            'subscription' => new SubscriptionResource($subscription),
        ]);
    }
}