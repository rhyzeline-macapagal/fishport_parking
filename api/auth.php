<?php

declare(strict_types=1);

function base64UrlEncode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64UrlDecode(string $value): string
{
    return base64_decode(strtr($value, '-_', '+/')) ?: '';
}

function createJwt(array $claims, string $secret, int $ttlSeconds = 28800): string
{
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
    $payload = base64UrlEncode(json_encode($claims + ['exp' => time() + $ttlSeconds], JSON_THROW_ON_ERROR));
    $signature = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));

    return "$header.$payload.$signature";
}

function decodeJwt(string $token, string $secret): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new RuntimeException('Invalid authentication token.');
    }

    [$header, $payload, $signature] = $parts;
    $expected = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));
    if (!hash_equals($expected, $signature)) {
        throw new RuntimeException('Invalid authentication token.');
    }

    $claims = json_decode(base64UrlDecode($payload), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($claims) || !isset($claims['exp']) || $claims['exp'] < time()) {
        throw new RuntimeException('Authentication token has expired.');
    }

    return $claims;
}

function requireAuth(array $config, array $roles = []): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        throw new RuntimeException('Authentication is required.');
    }

    $claims = decodeJwt($matches[1], $config['jwt_secret']);
    if ($roles !== [] && !in_array($claims['role'] ?? '', $roles, true)) {
        throw new RuntimeException('You do not have permission for this action.');
    }

    return $claims;
}
