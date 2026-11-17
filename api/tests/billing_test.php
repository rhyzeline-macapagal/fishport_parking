<?php

declare(strict_types=1);

require_once __DIR__ . '/../billing.php';

$timezone = new DateTimeZone('Asia/Manila');
$rate = [
    'grace_minutes' => 15,
    'first_hours' => 2,
    'first_hours_rate' => 40,
    'succeeding_rate' => 20,
    'daily_cap' => 300,
];

function assertSameValue(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(sprintf('%s: expected %s, got %s', $message, var_export($expected, true), var_export($actual, true)));
    }
}

$entry = new DateTimeImmutable('2026-01-01 08:00:00', $timezone);
assertSameValue(0.0, calculateParkingBill($entry, $entry->modify('+10 minutes'), $rate)['total'], 'within grace');
assertSameValue(40.0, calculateParkingBill($entry, $entry->modify('+2 hours'), $rate)['total'], 'exactly two hours');
assertSameValue(60.0, calculateParkingBill($entry, $entry->modify('+2 hours 16 minutes'), $rate)['total'], 'partial succeeding hour rounds up');
assertSameValue(240.0, calculateParkingBill($entry, $entry->modify('+12 hours'), $rate)['total'], 'overnight billing');
assertSameValue(600.0, calculateParkingBill($entry, $entry->modify('+36 hours'), $rate)['total'], 'daily cap applies per 24-hour period');

echo "Billing tests passed.\n";
