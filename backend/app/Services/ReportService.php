<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\AttendanceRecord;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Trainee;
use App\Support\CurrentOrganization;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportService
{
    public function attendanceReport(?string $from = null, ?string $to = null): Collection
    {
        $query = AttendanceRecord::query()
            ->with(['trainee.user', 'subscription.package'])
            ->orderByDesc('attendance_date');

        if ($from) {
            $query->whereDate('attendance_date', '>=', $from);
        }

        if ($to) {
            $query->whereDate('attendance_date', '<=', $to);
        }

        return $query->get();
    }

    public function revenueReport(?string $from = null, ?string $to = null): Collection
    {
        $query = Payment::query()
            ->with(['trainee.user', 'subscription'])
            ->where('status', PaymentStatus::Completed)
            ->orderByDesc('paid_at');

        if ($from) {
            $query->whereDate('paid_at', '>=', $from);
        }

        if ($to) {
            $query->whereDate('paid_at', '<=', $to);
        }

        return $query->get();
    }

    public function subscriptionsReport(): Collection
    {
        return Subscription::query()
            ->with(['trainee.user', 'package'])
            ->orderByDesc('id')
            ->get();
    }

    public function exportCsv(string $type, ?string $from = null, ?string $to = null): StreamedResponse
    {
        $rows = match ($type) {
            'attendance' => $this->attendanceReport($from, $to)->map(fn ($r) => [
                'date' => $r->attendance_date?->toDateString(),
                'trainee' => $r->trainee?->user?->name,
                'status' => $r->status?->value,
                'method' => $r->check_in_method?->value,
                'subscription_id' => $r->subscription_id,
            ]),
            'revenue' => $this->revenueReport($from, $to)->map(fn ($r) => [
                'paid_at' => optional($r->paid_at)?->toDateTimeString(),
                'trainee' => $r->trainee?->user?->name,
                'amount' => $r->amount,
                'currency' => $r->currency,
                'method' => $r->method?->value,
                'status' => $r->status?->value,
            ]),
            'subscriptions' => $this->subscriptionsReport()->map(fn ($r) => [
                'id' => $r->id,
                'trainee' => $r->trainee?->user?->name,
                'package' => $r->package?->name,
                'status' => $r->status?->value,
                'remaining_sessions' => $r->remaining_sessions,
                'started_at' => $r->started_at?->toDateString(),
                'ends_at' => $r->ends_at?->toDateString(),
            ]),
            default => collect(),
        };

        $filename = $type.'_report_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            if ($rows->isNotEmpty()) {
                fputcsv($handle, array_keys($rows->first()));
                foreach ($rows as $row) {
                    fputcsv($handle, $row);
                }
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function exportPdf(string $type, ?string $from = null, ?string $to = null)
    {
        $data = match ($type) {
            'attendance' => $this->attendanceReport($from, $to),
            'revenue' => $this->revenueReport($from, $to),
            'subscriptions' => $this->subscriptionsReport(),
            default => collect(),
        };

        $pdf = Pdf::loadView('reports.generic', [
            'type' => $type,
            'rows' => $data,
            'from' => $from,
            'to' => $to,
            'organizationId' => CurrentOrganization::id(),
            'generatedAt' => Carbon::now(),
        ]);

        return $pdf->download($type.'_report_'.now()->format('Ymd_His').'.pdf');
    }

    public function summary(?string $from = null, ?string $to = null): array
    {
        $attendance = $this->attendanceReport($from, $to);
        $revenue = $this->revenueReport($from, $to);

        return [
            'attendance_total' => $attendance->count(),
            'present_count' => $attendance->where('status', AttendanceStatus::Present)->count(),
            'revenue_total' => (float) $revenue->sum('amount'),
            'active_subscriptions' => Subscription::query()
                ->where('status', SubscriptionStatus::Active)
                ->count(),
            'trainees_count' => Trainee::query()->count(),
        ];
    }
}
