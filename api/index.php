<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/billing.php';
require_once __DIR__ . '/database.php';

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API configuration is missing. Copy config.sample.php to config.php.']);
    exit;
}

$config = require $configFile;
date_default_timezone_set($config['timezone'] ?? 'Asia/Manila');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($config['frontend_origin'] ?? ''));
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBody(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Request body must be valid JSON.');
    }
    return $data;
}

function requireText(array $data, string $key, int $maxLength = 255): string
{
    $value = trim((string) ($data[$key] ?? ''));
    if ($value === '' || strlen($value) > $maxLength) {
        throw new InvalidArgumentException("Invalid {$key}.");
    }
    return $value;
}

function normalizePlate(string $plate): string
{
    $plate = strtoupper(trim($plate));
    if (!preg_match('/^[A-Z0-9][A-Z0-9 -]{1,19}$/', $plate)) {
        throw new InvalidArgumentException('Plate number must be 2-20 characters using letters, numbers, spaces, or hyphens.');
    }
    return $plate;
}

function normalizeCardCode(string $code): string
{
    $code = strtoupper(trim($code));
    if (!preg_match('/^[A-Z0-9][A-Z0-9-]{2,31}$/', $code)) {
        throw new InvalidArgumentException('Invalid card code.');
    }
    return $code;
}

function audit(PDO $pdo, int $userId, string $action, ?int $ticketId = null): void
{
    $statement = $pdo->prepare(
        'INSERT INTO audit_logs (user_id, action, ticket_id, created_at) VALUES (?, ?, ?, NOW())'
    );
    $statement->execute([$userId, $action, $ticketId]);
}

function findRate(PDO $pdo, string $vehicleType): array
{
    $statement = $pdo->prepare('SELECT * FROM rates WHERE vehicle_type = ? LIMIT 1');
    $statement->execute([$vehicleType]);
    $rate = $statement->fetch();
    if (!$rate) {
        throw new RuntimeException('Rates are not configured for this vehicle type.');
    }
    return $rate;
}

function serializeCard(array $card): array
{
    return [
        'id' => (int) $card['id'],
        'card_code' => $card['card_code'],
        'status' => $card['status'],
        'created_at' => $card['created_at'],
    ];
}

function serializeTicket(array $ticket): array
{
    return [
        'id' => (int) $ticket['id'],
        'card_id' => $ticket['card_id'] === null ? null : (int) $ticket['card_id'],
        'card_code' => $ticket['card_code'] ?? null,
        'plate_no' => $ticket['plate_no'],
        'vehicle_type' => $ticket['vehicle_type'],
        'entry_time' => $ticket['entry_time'],
        'exit_time' => $ticket['exit_time'],
        'status' => $ticket['status'],
        'amount_due' => (float) $ticket['amount_due'],
        'amount_paid' => $ticket['amount_paid'] === null ? null : (float) $ticket['amount_paid'],
    ];
}

function cardWithActiveTicket(PDO $pdo, string $code, bool $lock = false): ?array
{
    $sql = 'SELECT c.*, t.id AS ticket_id, t.card_id, t.plate_no, t.vehicle_type,
                   t.entry_time, t.exit_time, t.status AS ticket_status,
                   t.amount_due, t.amount_paid
            FROM cards c
            LEFT JOIN vehicles_tickets t ON t.card_id = c.id AND t.status = \'active\'
            WHERE c.card_code = ?';
    if ($lock) {
        $sql .= ' FOR UPDATE';
    }
    $statement = $pdo->prepare($sql);
    $statement->execute([$code]);
    $row = $statement->fetch();
    return $row ?: null;
}

function ticketFromCardRow(array $row): array
{
    return [
        'id' => $row['ticket_id'],
        'card_id' => $row['card_id'],
        'card_code' => $row['card_code'],
        'plate_no' => $row['plate_no'],
        'vehicle_type' => $row['vehicle_type'],
        'entry_time' => $row['entry_time'],
        'exit_time' => $row['exit_time'],
        'status' => $row['ticket_status'],
        'amount_due' => $row['amount_due'],
        'amount_paid' => $row['amount_paid'],
    ];
}

try {
    $pdo = null;
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $segments = array_values(array_filter(explode('/', trim($path, '/'))));
    $knownResources = ['auth', 'cards', 'tickets', 'rates', 'users', 'dashboard', 'transactions'];
    if (!in_array($segments[0] ?? '', $knownResources, true)) {
        array_shift($segments);
    }
    $resource = $segments[0] ?? '';
    $identifier = $segments[1] ?? null;
    $subresource = $segments[2] ?? null;

    if ($resource === 'auth' && $identifier === 'login' && $method === 'POST') {
        $body = requestBody();
        $username = requireText($body, 'username', 80);
        $password = (string) ($body['password'] ?? '');
        if ($password === '') {
            throw new InvalidArgumentException('Password is required.');
        }
        $pdo = createPdo($config);
        $statement = $pdo->prepare('SELECT id, name, username, password_hash, role FROM users WHERE username = ? LIMIT 1');
        $statement->execute([$username]);
        $user = $statement->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            respond(['error' => 'Invalid username or password.'], 401);
        }
        respond([
            'token' => createJwt(['sub' => (int) $user['id'], 'name' => $user['name'], 'username' => $user['username'], 'role' => $user['role']], $config['jwt_secret']),
            'user' => ['id' => (int) $user['id'], 'name' => $user['name'], 'username' => $user['username'], 'role' => $user['role']],
        ]);
    }

    if ($resource === 'cards' && $identifier === null && $method === 'GET') {
        requireAuth($config, ['admin']);
        $pdo = createPdo($config);
        respond(['cards' => array_map('serializeCard', $pdo->query('SELECT * FROM cards ORDER BY id')->fetchAll())]);
    }

    if ($resource === 'cards' && $identifier === null && $method === 'POST') {
        $claims = requireAuth($config, ['admin']);
        $body = requestBody();
        $count = filter_var($body['count'] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 1000]]);
        if (!$count) {
            throw new InvalidArgumentException('Card count must be between 1 and 1000.');
        }
        $prefix = strtoupper(trim((string) ($body['prefix'] ?? 'PF-')));
        if (!preg_match('/^[A-Z0-9-]{1,20}$/', $prefix)) {
            throw new InvalidArgumentException('Invalid card prefix.');
        }
        $pdo = createPdo($config);
        $pdo->beginTransaction();
        $next = (int) $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM cards')->fetchColumn();
        $insert = $pdo->prepare('INSERT INTO cards (card_code, status, created_at) VALUES (?, \'available\', NOW())');
        $created = [];
        for ($i = 0; $i < $count; $i++) {
            $code = $prefix . str_pad((string) ($next + $i), 4, '0', STR_PAD_LEFT);
            $insert->execute([$code]);
            $created[] = ['card_code' => $code, 'status' => 'available'];
        }
        $pdo->commit();
        audit($pdo, (int) $claims['sub'], 'cards_generate');
        respond(['cards' => $created], 201);
    }

    if ($resource === 'cards' && $identifier !== null && $subresource === null && $method === 'GET') {
        $claims = requireAuth($config, ['guard_entrance', 'guard_exit', 'admin']);
        $code = normalizeCardCode($identifier);
        $pdo = createPdo($config);
        $card = cardWithActiveTicket($pdo, $code);
        if (!$card) {
            respond(['error' => 'Card not found.'], 404);
        }
        $result = ['card' => serializeCard($card)];
        if ($claims['role'] !== 'guard_entrance' && $card['ticket_id'] !== null) {
            $result['ticket'] = serializeTicket(ticketFromCardRow($card));
        }
        respond($result);
    }

    if ($resource === 'cards' && $identifier !== null && $subresource === 'active' && $method === 'GET') {
        requireAuth($config, ['guard_exit', 'admin']);
        $code = normalizeCardCode($identifier);
        $pdo = createPdo($config);
        $card = cardWithActiveTicket($pdo, $code);
        if (!$card) {
            respond(['error' => 'Card not found.'], 404);
        }
        if ($card['status'] !== 'in_use' || $card['ticket_id'] === null) {
            respond(['error' => 'This card has no active ticket.'], 409);
        }
        $ticket = ticketFromCardRow($card);
        $entry = new DateTimeImmutable($ticket['entry_time'], new DateTimeZone($config['timezone']));
        $exit = new DateTimeImmutable('now', new DateTimeZone($config['timezone']));
        respond(['card' => serializeCard($card), 'ticket' => serializeTicket($ticket), 'billing' => calculateParkingBill($entry, $exit, findRate($pdo, $ticket['vehicle_type'])), 'exit_time' => $exit->format('Y-m-d H:i:s')]);
    }

    if ($resource === 'tickets' && $identifier === 'entry' && $method === 'POST') {
        $claims = requireAuth($config, ['guard_entrance', 'admin']);
        $body = requestBody();
        $plate = normalizePlate(requireText($body, 'plate_no', 20));
        $vehicleType = (string) ($body['vehicle_type'] ?? 'Car');
        $code = normalizeCardCode(requireText($body, 'card_code', 32));
        if (!in_array($vehicleType, ['Car', 'Motorcycle', 'Van'], true)) {
            throw new InvalidArgumentException('Invalid vehicle type.');
        }
        $pdo = createPdo($config);
        $pdo->beginTransaction();
        $card = cardWithActiveTicket($pdo, $code, true);
        if (!$card) {
            $pdo->rollBack();
            respond(['error' => 'Card not found.'], 404);
        }
        if ($card['status'] !== 'available') {
            $pdo->rollBack();
            respond(['error' => "Card is {$card['status']} and cannot be issued."], 409);
        }
        $duplicate = $pdo->prepare("SELECT id FROM vehicles_tickets WHERE plate_no = ? AND status = 'active' LIMIT 1");
        $duplicate->execute([$plate]);
        if ($duplicate->fetch()) {
            $pdo->rollBack();
            respond(['error' => 'This plate already has an active ticket.'], 409);
        }
        $insert = $pdo->prepare('INSERT INTO vehicles_tickets (card_id, ticket_token, plate_no, vehicle_type, entry_time, status, entry_guard_id) VALUES (?, ?, ?, ?, NOW(), \'active\', ?)');
        $insert->execute([(int) $card['id'], bin2hex(random_bytes(32)), $plate, $vehicleType, (int) $claims['sub']]);
        $ticketId = (int) $pdo->lastInsertId();
        $pdo->prepare("UPDATE cards SET status = 'in_use' WHERE id = ? AND status = 'available'")->execute([(int) $card['id']]);
        audit($pdo, (int) $claims['sub'], 'ticket_entry', $ticketId);
        $ticket = $pdo->prepare('SELECT t.*, c.card_code FROM vehicles_tickets t JOIN cards c ON c.id = t.card_id WHERE t.id = ?');
        $ticket->execute([$ticketId]);
        $pdo->commit();
        respond(['ticket' => serializeTicket($ticket->fetch())], 201);
    }

    if ($resource === 'cards' && $identifier !== null && $subresource === 'checkout' && $method === 'POST') {
        $claims = requireAuth($config, ['guard_exit', 'admin']);
        $code = normalizeCardCode($identifier);
        $body = requestBody();
        $confirm = filter_var($body['confirm_payment'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $pdo = createPdo($config);
        $pdo->beginTransaction();
        $card = cardWithActiveTicket($pdo, $code, true);
        if (!$card) {
            $pdo->rollBack();
            respond(['error' => 'Card not found.'], 404);
        }
        if ($card['status'] !== 'in_use' || $card['ticket_id'] === null) {
            $pdo->rollBack();
            respond(['error' => 'This card has no active ticket.'], 409);
        }
        $ticket = ticketFromCardRow($card);
        $entry = new DateTimeImmutable($ticket['entry_time'], new DateTimeZone($config['timezone']));
        $exit = new DateTimeImmutable('now', new DateTimeZone($config['timezone']));
        $bill = calculateParkingBill($entry, $exit, findRate($pdo, $ticket['vehicle_type']));
        if (!$confirm) {
            $pdo->rollBack();
            respond(['ticket' => serializeTicket($ticket), 'billing' => $bill, 'exit_time' => $exit->format('Y-m-d H:i:s')]);
        }
        $update = $pdo->prepare("UPDATE vehicles_tickets SET exit_time = NOW(), status = 'paid', amount_due = ?, amount_paid = ?, exit_guard_id = ? WHERE id = ? AND status = 'active'");
        $update->execute([$bill['total'], $bill['total'], (int) $claims['sub'], (int) $ticket['id']]);
        $pdo->prepare("UPDATE cards SET status = 'available' WHERE id = ? AND status = 'in_use'")->execute([(int) $card['id']]);
        audit($pdo, (int) $claims['sub'], 'ticket_checkout', (int) $ticket['id']);
        $pdo->commit();
        respond(['ticket' => serializeTicket(array_merge($ticket, ['exit_time' => $exit->format('Y-m-d H:i:s'), 'status' => 'paid', 'amount_due' => $bill['total'], 'amount_paid' => $bill['total']])) , 'billing' => $bill, 'exit_time' => $exit->format('Y-m-d H:i:s')]);
    }

    if ($resource === 'tickets' && $identifier === 'lost' && $method === 'POST') {
        $claims = requireAuth($config, ['guard_exit', 'admin']);
        $body = requestBody();
        $plate = normalizePlate(requireText($body, 'plate_no', 20));
        $pdo = createPdo($config);
        $pdo->beginTransaction();
        $statement = $pdo->prepare("SELECT t.*, c.card_code FROM vehicles_tickets t JOIN cards c ON c.id = t.card_id WHERE t.plate_no = ? AND t.status = 'active' ORDER BY t.entry_time DESC LIMIT 1 FOR UPDATE");
        $statement->execute([$plate]);
        $ticket = $statement->fetch();
        if (!$ticket) {
            $pdo->rollBack();
            respond(['error' => 'No active ticket found for this plate.'], 404);
        }
        $rate = findRate($pdo, $ticket['vehicle_type']);
        $fee = (float) $rate['lost_ticket_fee'];
        $update = $pdo->prepare("UPDATE vehicles_tickets SET status = 'lost', exit_time = NOW(), amount_due = ?, amount_paid = ?, exit_guard_id = ? WHERE id = ? AND status = 'active'");
        $update->execute([$fee, $fee, (int) $claims['sub'], (int) $ticket['id']]);
        $pdo->prepare("UPDATE cards SET status = 'lost' WHERE id = ?")->execute([(int) $ticket['card_id']]);
        audit($pdo, (int) $claims['sub'], 'ticket_lost', (int) $ticket['id']);
        $pdo->commit();
        respond(['ticket' => serializeTicket(array_merge($ticket, ['status' => 'lost', 'exit_time' => date('Y-m-d H:i:s'), 'amount_due' => $fee, 'amount_paid' => $fee])), 'billing' => ['total' => $fee, 'computation' => 'Lost card fee']]);
    }

    if ($resource === 'cards' && $identifier !== null && $method === 'PUT') {
        $claims = requireAuth($config, ['admin']);
        $code = normalizeCardCode($identifier);
        $status = (string) (requestBody()['status'] ?? '');
        if (!in_array($status, ['available', 'disabled'], true)) {
            throw new InvalidArgumentException('Cards may only be manually set to available or disabled.');
        }
        $pdo = createPdo($config);
        $statement = $pdo->prepare('UPDATE cards SET status = ? WHERE card_code = ? AND status <> \'in_use\' AND status <> \'lost\'');
        $statement->execute([$status, $code]);
        if ($statement->rowCount() === 0) {
            respond(['error' => 'Card not found or cannot be changed while in use or lost.'], 409);
        }
        audit($pdo, (int) $claims['sub'], 'card_status_update');
        $card = $pdo->prepare('SELECT * FROM cards WHERE card_code = ?');
        $card->execute([$code]);
        respond(['card' => serializeCard($card->fetch())]);
    }

    if ($resource === 'rates' && $method === 'GET') {
        requireAuth($config, ['admin']);
        $pdo = createPdo($config);
        respond(['rates' => $pdo->query('SELECT * FROM rates ORDER BY vehicle_type')->fetchAll()]);
    }

    if ($resource === 'users' && $method === 'GET') {
        requireAuth($config, ['admin']);
        $pdo = createPdo($config);
        respond(['users' => $pdo->query('SELECT id, name, username, role, created_at FROM users ORDER BY name')->fetchAll()]);
    }

    if ($resource === 'users' && $method === 'POST') {
        $claims = requireAuth($config, ['admin']);
        $body = requestBody();
        $name = requireText($body, 'name', 120);
        $username = requireText($body, 'username', 80);
        $password = (string) ($body['password'] ?? '');
        $role = (string) ($body['role'] ?? '');
        if (!preg_match('/^[A-Za-z0-9._-]{3,80}$/', $username) || strlen($password) < 8) {
            throw new InvalidArgumentException('Username must be 3-80 characters and password must be at least 8 characters.');
        }
        if (!in_array($role, ['admin', 'guard_entrance', 'guard_exit'], true)) {
            throw new InvalidArgumentException('Invalid user role.');
        }
        $pdo = createPdo($config);
        try {
            $statement = $pdo->prepare('INSERT INTO users (name, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())');
            $statement->execute([$name, $username, password_hash($password, PASSWORD_DEFAULT), $role]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                respond(['error' => 'Username is already in use.'], 409);
            }
            throw $exception;
        }
        audit($pdo, (int) $claims['sub'], 'user_create');
        respond(['user' => ['id' => (int) $pdo->lastInsertId(), 'name' => $name, 'username' => $username, 'role' => $role]], 201);
    }

    if ($resource === 'rates' && $method === 'PUT') {
        $claims = requireAuth($config, ['admin']);
        $body = requestBody();
        $vehicleType = (string) ($body['vehicle_type'] ?? '');
        if (!in_array($vehicleType, ['Car', 'Motorcycle', 'Van'], true)) {
            throw new InvalidArgumentException('Invalid vehicle type.');
        }
        $fields = ['grace_minutes', 'first_hours', 'first_hours_rate', 'succeeding_rate', 'daily_cap', 'lost_ticket_fee'];
        foreach ($fields as $field) {
            if (!isset($body[$field]) || !is_numeric($body[$field]) || (float) $body[$field] < 0) {
                throw new InvalidArgumentException("Invalid {$field}.");
            }
        }
        $pdo = createPdo($config);
        $statement = $pdo->prepare('UPDATE rates SET grace_minutes = ?, first_hours = ?, first_hours_rate = ?, succeeding_rate = ?, daily_cap = ?, lost_ticket_fee = ?, updated_at = NOW() WHERE vehicle_type = ?');
        $statement->execute([(int) $body['grace_minutes'], (float) $body['first_hours'], (float) $body['first_hours_rate'], (float) $body['succeeding_rate'], (float) $body['daily_cap'], (float) $body['lost_ticket_fee'], $vehicleType]);
        audit($pdo, (int) $claims['sub'], 'rate_update');
        respond(['rate' => findRate($pdo, $vehicleType)]);
    }

    if ($resource === 'dashboard' && $identifier === 'stats' && $method === 'GET') {
        requireAuth($config, ['admin']);
        $pdo = createPdo($config);
        respond([
            'stats' => [
                'vehicles_inside' => (int) $pdo->query("SELECT COUNT(*) FROM vehicles_tickets WHERE status = 'active'")->fetchColumn(),
                'today_revenue' => (float) $pdo->query("SELECT COALESCE(SUM(amount_paid), 0) FROM vehicles_tickets WHERE status IN ('paid', 'lost') AND DATE(exit_time) = CURDATE()")->fetchColumn(),
                'total_vehicles_today' => (int) $pdo->query("SELECT COUNT(*) FROM vehicles_tickets WHERE DATE(entry_time) = CURDATE()")->fetchColumn(),
            ],
            'recent_transactions' => $pdo->query('SELECT t.id, c.card_code, t.plate_no, t.vehicle_type, t.entry_time, t.exit_time, t.status, t.amount_due, t.amount_paid FROM vehicles_tickets t LEFT JOIN cards c ON c.id = t.card_id ORDER BY t.id DESC LIMIT 10')->fetchAll(),
        ]);
    }

    if ($resource === 'transactions' && $method === 'GET') {
        requireAuth($config, ['admin']);
        $pdo = createPdo($config);
        $where = [];
        $params = [];
        if (!empty($_GET['plate'])) {
            $where[] = 't.plate_no LIKE ?';
            $params[] = '%' . normalizePlate((string) $_GET['plate']) . '%';
        }
        if (!empty($_GET['status']) && in_array($_GET['status'], ['active', 'paid', 'lost'], true)) {
            $where[] = 't.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['date'])) {
            $date = (string) $_GET['date'];
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                throw new InvalidArgumentException('Invalid date filter.');
            }
            $where[] = 'DATE(t.entry_time) = ?';
            $params[] = $date;
        }
        $sql = 'SELECT t.id, c.card_code, t.plate_no, t.vehicle_type, t.entry_time, t.exit_time, t.status, t.amount_due, t.amount_paid FROM vehicles_tickets t LEFT JOIN cards c ON c.id = t.card_id';
        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY t.entry_time DESC LIMIT 500';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        respond(['transactions' => $statement->fetchAll()]);
    }

    respond(['error' => 'Route not found.'], 404);
} catch (InvalidArgumentException $exception) {
    respond(['error' => $exception->getMessage()], 422);
} catch (RuntimeException $exception) {
    $status = str_contains($exception->getMessage(), 'permission') ? 403 : 401;
    respond(['error' => $exception->getMessage()], $status);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    respond(['error' => 'An unexpected server error occurred.'], 500);
}
