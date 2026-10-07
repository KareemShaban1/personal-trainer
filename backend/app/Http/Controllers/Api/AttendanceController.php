<?php

namespace App\Http\Controllers\Api;

use App\Enums\AttendanceStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\BulkStoreAttendanceRequest;
use App\Http\Requests\Attendance\ScanAttendanceRequest;
use App\Http\Requests\Attendance\SelfCheckInRequest;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\AttendanceRecord;
use App\Models\Branch;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\Trainee;
use App\Services\AttendanceService;
use App\Services\QrAttendanceService;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendanceService,
        private readonly QrAttendanceService $qrAttendanceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AttendanceRecord::class);

        $query = AttendanceRecord::query()->with(['trainee.user', 'subscription.package']);

        if ($request->user()->hasRole(Role::Parent->value)) {
            $ids = $request->user()->parentProfile?->trainees()->pluck('trainees.id') ?? collect();
            $query->whereIn('trainee_id', $ids);
        } elseif ($request->user()->hasRole(Role::Trainee->value)) {
            $traineeId = $request->user()->traineeProfile?->id;
            $query->where('trainee_id', $traineeId);
        }

        if ($request->filled('date')) {
            $query->whereDate('attendance_date', $request->string('date'));
        }

        if ($request->filled('from')) {
            $query->whereDate('attendance_date', '>=', $request->string('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('attendance_date', '<=', $request->string('to'));
        }

        if ($request->filled('trainee_id')) {
            $query->where('trainee_id', $request->integer('trainee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $perPage = min(max((int) $request->integer('per_page', 30), 1), 200);

        return AttendanceResource::collection(
            $query->latest('attendance_date')->latest('id')->paginate($perPage)
        )->response();
    }

    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', AttendanceRecord::class);

        $trainee = Trainee::query()->findOrFail($request->integer('trainee_id'));
        $subscription = Subscription::query()->findOrFail($request->integer('subscription_id'));
        $branch = $request->filled('branch_id')
            ? Branch::query()->find($request->integer('branch_id'))
            : null;

        $record = $this->attendanceService->mark(
            $trainee,
            $subscription,
            AttendanceStatus::from($request->string('status')),
            $request->input('attendance_date'),
            actor: $request->user(),
            branch: $branch,
            latitude: $request->input('latitude'),
            longitude: $request->input('longitude'),
            notes: $request->input('notes')
        );

        return response()->json([
            'message' => 'Attendance recorded.',
            'attendance' => new AttendanceResource($record),
        ], 201);
    }

    public function bulkStore(BulkStoreAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', AttendanceRecord::class);

        $result = $this->attendanceService->markBulk(
            $request->input('records', []),
            $request->input('attendance_date'),
            $request->user()
        );

        return response()->json([
            'message' => 'Bulk attendance processed.',
            'recorded' => AttendanceResource::collection(collect($result['recorded'])),
            'errors' => $result['errors'],
            'recorded_count' => count($result['recorded']),
            'error_count' => count($result['errors']),
        ], count($result['recorded']) > 0 ? 201 : 422);
    }

    public function update(UpdateAttendanceRequest $request, AttendanceRecord $attendance): JsonResponse
    {
        $this->authorize('update', $attendance);

        $record = $this->attendanceService->update(
            $attendance,
            AttendanceStatus::from($request->string('status')),
            $request->input('notes'),
            $request->user()
        );

        return response()->json([
            'message' => 'Attendance updated.',
            'attendance' => new AttendanceResource($record),
        ]);
    }

    public function scan(ScanAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', AttendanceRecord::class);

        $record = $this->qrAttendanceService->scanTraineeToken(
            $request->string('token'),
            $request->user(),
            $request->input('latitude'),
            $request->input('longitude')
        );

        return response()->json([
            'message' => 'QR scan attendance recorded.',
            'attendance' => new AttendanceResource($record),
        ], 201);
    }

    public function selfCheckIn(SelfCheckInRequest $request): JsonResponse
    {
        $trainee = $request->user()->traineeProfile;

        if (! $trainee) {
            return response()->json(['message' => 'Only trainees can self check-in.'], 403);
        }

        $record = $this->qrAttendanceService->selfCheckIn(
            $trainee,
            $request->string('org_qr_token'),
            $request->input('latitude'),
            $request->input('longitude')
        );

        return response()->json([
            'message' => 'Self check-in successful.',
            'attendance' => new AttendanceResource($record),
        ], 201);
    }

    public function myQrToken(Request $request): JsonResponse
    {
        $trainee = $request->user()->traineeProfile;

        if (! $trainee) {
            return response()->json(['message' => 'Only trainees have QR tokens.'], 403);
        }

        $token = $this->qrAttendanceService->issueTraineeOpaqueToken($trainee);

        return response()->json([
            'token' => $token->token,
            'type' => $token->type->value,
        ]);
    }

    public function orgCheckInQr(Request $request): JsonResponse
    {
        $this->authorize('create', AttendanceRecord::class);

        $organization = Organization::query()->findOrFail(CurrentOrganization::id());
        $token = $this->qrAttendanceService->issueOrgCheckInQr($organization);

        return response()->json([
            'token' => $token->token,
            'type' => $token->type->value,
            'expires_at' => $token->expires_at,
        ]);
    }
}