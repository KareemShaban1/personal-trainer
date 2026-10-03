<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ ucfirst($type) }} Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #222; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f3f3f3; }
    </style>
</head>
<body>
    <h1>{{ ucfirst($type) }} Report</h1>
    <div class="meta">
        Generated: {{ $generatedAt }} |
        Org: {{ $organizationId }} |
        From: {{ $from ?? '—' }} |
        To: {{ $to ?? '—' }}
    </div>

    <table>
        <thead>
            <tr>
                @if($type === 'attendance')
                    <th>Date</th><th>Trainee</th><th>Status</th><th>Method</th>
                @elseif($type === 'revenue')
                    <th>Paid At</th><th>Trainee</th><th>Amount</th><th>Method</th>
                @else
                    <th>ID</th><th>Trainee</th><th>Package</th><th>Status</th><th>Remaining</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    @if($type === 'attendance')
                        <td>{{ $row->attendance_date }}</td>
                        <td>{{ $row->trainee?->user?->name }}</td>
                        <td>{{ $row->status?->value }}</td>
                        <td>{{ $row->check_in_method?->value }}</td>
                    @elseif($type === 'revenue')
                        <td>{{ $row->paid_at }}</td>
                        <td>{{ $row->trainee?->user?->name }}</td>
                        <td>{{ $row->amount }} {{ $row->currency }}</td>
                        <td>{{ $row->method?->value }}</td>
                    @else
                        <td>{{ $row->id }}</td>
                        <td>{{ $row->trainee?->user?->name }}</td>
                        <td>{{ $row->package?->name }}</td>
                        <td>{{ $row->status?->value }}</td>
                        <td>{{ $row->remaining_sessions }}</td>
                    @endif
                </tr>
            @empty
                <tr><td colspan="5">No data</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
