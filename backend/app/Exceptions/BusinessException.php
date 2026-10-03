<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class BusinessException extends Exception
{
    public function __construct(
        string $message,
        protected int $status = 422,
        protected array $errors = []
    ) {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        $payload = ['message' => $this->getMessage()];

        if ($this->errors !== []) {
            $payload['errors'] = $this->errors;
        }

        return response()->json($payload, $this->status);
    }
}
