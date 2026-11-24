export type User = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "guard_entrance" | "guard_exit";
};

export type VehicleTypeCode = "2W" | "3W" | "4W" | "6W" | "10W";

export const VEHICLE_TYPES: { code: VehicleTypeCode; label: string }[] = [
  { code: "2W", label: "2-Wheels (Motorcycle)" },
  { code: "3W", label: "3-Wheels (Tricycle)" },
  { code: "4W", label: "4-Wheels (Car / Van)" },
  { code: "6W", label: "6-Wheels (Truck)" },
  { code: "10W", label: "10-Wheels (Truck)" },
];

export function vehicleLabel(code: string | null | undefined): string {
  return VEHICLE_TYPES.find(type => type.code === code)?.label || code || "—";
}

export type StaffRef = {
  id: number;
  name: string;
  username: string;
} | null;

export type Ticket = {
  id: number;
  card_id: number | null;
  card_code: string | null;
  plate_no: string;
  vehicle_type: string;
  ticket_type?: "regular" | "vip";
  vip_name?: string | null;
  vip_purpose?: string | null;
  entry_time: string;
  exit_time: string | null;
  status: "active" | "paid" | "lost";
  amount_due: number;
  amount_paid: number | null;
  entrance_guard: StaffRef;
  exit_guard: StaffRef;
};

export type Card = {
  id: number;
  card_code: string;
  card_type: "regular" | "vip";
  status: "available" | "in_use" | "lost" | "disabled";
  created_at?: string;
};

export type Billing = {
  duration_minutes?: number;
  rule_applied: "vip" | "lost" | "grace" | "overnight" | "regular";
  base_fee: number;
  succeeding_hours: number;
  succeeding_fee: number;
  overnights: number;
  overnight_fee: number;
  total: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  const token = typeof window !== "undefined" ? localStorage.getItem("parking_token") : null;
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const isoValue = value.includes("T") || value.includes("Z")
    ? value
    : value.replace(" ", "T") + "+08:00";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}
