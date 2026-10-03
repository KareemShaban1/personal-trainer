<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Payment::class);

        $payments = Payment::query()
            ->with(['trainee.user', 'subscription'])
            ->when($request->filled('trainee_id'), fn ($q) => $q->where('trainee_id', $request->integer('trainee_id')))
            ->latest('paid_at')
            ->paginate(20);

        return PaymentResource::collection($payments)->response();
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $this->authorize('create', Payment::class);

        $payment = Payment::query()->create([
            'organization_id' => CurrentOrganization::id(),
            'trainee_id' => $request->integer('trainee_id'),
            'subscription_id' => $request->input('subscription_id'),
            'amount' => $request->input('amount'),
            'currency' => $request->input('currency', 'EGP'),
            'method' => $request->input('method'),
            'status' => $request->input('status', PaymentStatus::Completed->value),
            'paid_at' => $request->input('paid_at', now()),
            'reference' => $request->input('reference'),
            'notes' => $request->input('notes'),
            'recorded_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Payment recorded.',
            'payment' => new PaymentResource($payment->load('trainee.user')),
        ], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        $this->authorize('view', $payment);

        return response()->json([
            'payment' => new PaymentResource($payment->load(['trainee.user', 'subscription'])),
        ]);
    }
}