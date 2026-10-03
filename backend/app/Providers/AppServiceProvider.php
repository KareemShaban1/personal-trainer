<?php

namespace App\Providers;

use App\Models\AttendanceRecord;
use App\Models\Note;
use App\Models\Organization;
use App\Models\Package;
use App\Models\ParentProfile;
use App\Models\Payment;
use App\Models\ProgressRecord;
use App\Models\Subscription;
use App\Models\Trainee;
use App\Policies\AttendanceRecordPolicy;
use App\Policies\NotePolicy;
use App\Policies\OrganizationPolicy;
use App\Policies\PackagePolicy;
use App\Policies\ParentProfilePolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ProgressRecordPolicy;
use App\Policies\SubscriptionPolicy;
use App\Policies\TraineePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        Gate::policy(Trainee::class, TraineePolicy::class);
        Gate::policy(ParentProfile::class, ParentProfilePolicy::class);
        Gate::policy(Package::class, PackagePolicy::class);
        Gate::policy(Subscription::class, SubscriptionPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(AttendanceRecord::class, AttendanceRecordPolicy::class);
        Gate::policy(ProgressRecord::class, ProgressRecordPolicy::class);
        Gate::policy(Note::class, NotePolicy::class);
        Gate::policy(Organization::class, OrganizationPolicy::class);

        Gate::define('viewReports', function ($user) {
            return app(OrganizationPolicy::class)->viewReports($user);
        });

        Route::bind('parent', function (string $value) {
            return ParentProfile::query()->findOrFail($value);
        });

        Route::bind('progress', function (string $value) {
            return ProgressRecord::query()->findOrFail($value);
        });
    }
}
