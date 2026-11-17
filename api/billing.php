<?php

declare(strict_types=1);

function calculateParkingBill(
    DateTimeImmutable $entryTime,
    DateTimeImmutable $exitTime,
    array $rate
): array {
    if ($exitTime < $entryTime) {
        throw new InvalidArgumentException('Exit time cannot be earlier than entry time.');
    }

    $durationSeconds = $exitTime->getTimestamp() - $entryTime->getTimestamp();
    $graceSeconds = max(0, (int) $rate['grace_minutes']) * 60;
    $billableSeconds = max(0, $durationSeconds - $graceSeconds);
    $billableHours = (int) ceil($billableSeconds / 3600);
    $firstHours = max(0, (float) $rate['first_hours']);
    $firstHoursRate = max(0, (float) $rate['first_hours_rate']);
    $succeedingRate = max(0, (float) $rate['succeeding_rate']);

    if ($billableHours === 0) {
        $firstHoursCharged = 0;
        $succeedingHours = 0;
        $subtotal = 0.0;
        $computation = 'Within grace period: ₱0.00';
    } else {
        $firstHoursCharged = min($billableHours, (int) ceil($firstHours));
        $succeedingHours = max(0, $billableHours - (int) ceil($firstHours));
        $subtotal = $firstHoursRate + ($succeedingHours * $succeedingRate);
        $computation = sprintf(
            'First %s hrs: ₱%s%s',
            rtrim(rtrim(number_format($firstHours, 2), '0'), '.'),
            number_format($firstHoursRate, 2),
            $succeedingHours > 0
                ? sprintf(' + %d hrs x ₱%s = ₱%s', $succeedingHours, number_format($succeedingRate, 2), number_format($subtotal, 2))
                : sprintf(' = ₱%s', number_format($subtotal, 2))
        );
    }

    $cap = max(0, (float) $rate['daily_cap']);
    $capPeriods = max(1, (int) ceil(max(1, $durationSeconds) / 86400));
    $maximumCharge = $cap * $capPeriods;
    $total = $cap > 0 ? min($subtotal, $maximumCharge) : $subtotal;
    if ($total < $subtotal) {
        $computation .= sprintf('; %d-day cap applied: ₱%s', $capPeriods, number_format($maximumCharge, 2));
    }

    return [
        'duration_seconds' => $durationSeconds,
        'duration_minutes' => (int) ceil($durationSeconds / 60),
        'billable_hours' => $billableHours,
        'first_hours_charged' => $firstHoursCharged,
        'succeeding_hours' => $succeedingHours,
        'subtotal' => round($subtotal, 2),
        'daily_cap_periods' => $capPeriods,
        'total' => round($total, 2),
        'computation' => $computation,
    ];
}
