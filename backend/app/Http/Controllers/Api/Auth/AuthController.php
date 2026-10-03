<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterOrganizationRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\OrganizationResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\OrganizationRegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        private readonly OrganizationRegistrationService $registrationService,
        private readonly AuditLogger $auditLogger
    ) {}

    public function register(RegisterOrganizationRequest $request): JsonResponse
    {
        $result = $this->registrationService->register($request->validated());

        return response()->json([
            'message' => 'Organization registered successfully.',
            'token' => $result['token'],
            'token_type' => 'Bearer',
            'user' => new UserResource($result['owner']->load('roles', 'organizations')),
            'organization' => new OrganizationResource($result['organization']),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->authenticate($request, requireSuperAdmin: false);
    }

    public function superAdminLogin(LoginRequest $request): JsonResponse
    {
        return $this->authenticate($request, requireSuperAdmin: true);
    }

    private function authenticate(LoginRequest $request, bool $requireSuperAdmin): JsonResponse
    {
        $user = null;

        if ($request->filled('email')) {
            $user = User::query()->where('email', $request->string('email'))->first();
        } elseif ($request->filled('phone')) {
            $user = User::query()->where('phone', $request->string('phone'))->first();
        }

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if ($user->status?->value === 'suspended' || $user->status?->value === 'inactive') {
            return response()->json(['message' => 'Account is not active.'], 403);
        }

        $isSuperAdmin = $user->isSuperAdmin();

        if ($requireSuperAdmin && ! $isSuperAdmin) {
            return response()->json(['message' => 'Super admin access only.'], 403);
        }

        if (! $requireSuperAdmin && $isSuperAdmin) {
            return response()->json([
                'message' => 'Use the super admin login page.',
            ], 403);
        }

        if ($requireSuperAdmin && ! $request->filled('email')) {
            return response()->json(['message' => 'Email is required for super admin login.'], 422);
        }

        $device = $request->string('device_name')->toString() ?: 'api';
        $token = $user->createToken($device)->plainTextToken;

        $this->auditLogger->log(
            $requireSuperAdmin ? 'auth.super_admin_login' : 'auth.login',
            $user,
            null,
            null,
            $user
        );

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('roles', 'organizations')),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'organizations', 'traineeProfile', 'parentProfile.trainees']);

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $identifier = $request->filled('email')
            ? $request->string('email')->toString()
            : $request->string('phone')->toString();

        $user = $request->filled('email')
            ? User::query()->where('email', $identifier)->first()
            : User::query()->where('phone', $identifier)->first();

        if ($user) {
            $plain = Str::random(64);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['identifier' => $identifier],
                ['token' => Hash::make($plain), 'created_at' => now()]
            );

            // In production this would be emailed/SMS'd. Return token in local for testing.
            if (app()->environment(['local', 'testing'])) {
                return response()->json([
                    'message' => 'Password reset token generated.',
                    'reset_token' => $plain,
                    'identifier' => $identifier,
                ]);
            }
        }

        return response()->json([
            'message' => 'If the account exists, a reset token has been issued.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $identifier = $request->filled('email')
            ? $request->string('email')->toString()
            : $request->string('phone')->toString();

        $row = DB::table('password_reset_tokens')->where('identifier', $identifier)->first();

        if (! $row || ! Hash::check($request->string('token'), $row->token)) {
            return response()->json(['message' => 'Invalid reset token.'], 422);
        }

        if (now()->diffInMinutes($row->created_at) > 60) {
            return response()->json(['message' => 'Reset token expired.'], 422);
        }

        $user = $request->filled('email')
            ? User::query()->where('email', $identifier)->first()
            : User::query()->where('phone', $identifier)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->password = $request->string('password');
        $user->save();

        DB::table('password_reset_tokens')->where('identifier', $identifier)->delete();
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->string('current_password'), $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->password = $request->string('password');
        $user->save();
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password changed successfully.']);
    }
}