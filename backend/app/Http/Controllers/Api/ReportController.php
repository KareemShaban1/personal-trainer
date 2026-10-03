<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ReportFilterRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}

    public function summary(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewReports');

        return response()->json([
            'summary' => $this->reportService->summary(
                $request->input('from'),
                $request->input('to')
            ),
        ]);
    }

    public function attendance(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewReports');

        return response()->json([
            'data' => $this->reportService->attendanceReport(
                $request->input('from'),
                $request->input('to')
            ),
        ]);
    }

    public function revenue(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewReports');

        return response()->json([
            'data' => $this->reportService->revenueReport(
                $request->input('from'),
                $request->input('to')
            ),
        ]);
    }

    public function subscriptions(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewReports');

        return response()->json([
            'data' => $this->reportService->subscriptionsReport(),
        ]);
    }

    public function export(ReportFilterRequest $request)
    {
        $this->authorize('viewReports');

        $type = $request->input('type', 'attendance');
        $format = $request->input('format', 'csv');

        return $format === 'pdf'
            ? $this->reportService->exportPdf($type, $request->input('from'), $request->input('to'))
            : $this->reportService->exportCsv($type, $request->input('from'), $request->input('to'));
    }
}