import { StaffRef } from "../lib/api";

export function StaffBadge({ staff, title }: { staff: StaffRef; title?: string }) {
  if (!staff) {
    return <span className="text-slate-400" title={title}>{title ? `${title}: ` : ""}—</span>;
  }
  return (
    <span className="min-w-0 break-words text-slate-700" title={`${staff.name} (@${staff.username})`}>
      <span className="block font-bold">{staff.name}</span>
      <span className="block text-xs text-slate-500">@{staff.username}</span>
    </span>
  );
}
