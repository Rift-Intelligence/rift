export type ChatDateGroup = {
  label: string;
  chats: Array<{ id: string; title?: string | null; update_time?: number }>;
};

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function groupChatsByDate<T extends { update_time?: number }>(
  chats: T[],
): Array<{ label: string; chats: T[] }> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86_400_000;
  const weekStart = todayStart - 6 * 86_400_000;

  const today: T[] = [];
  const yesterday: T[] = [];
  const thisWeek: T[] = [];
  const older: T[] = [];

  for (const chat of chats) {
    const t = chat.update_time ?? 0;
    if (t >= todayStart) today.push(chat);
    else if (t >= yesterdayStart) yesterday.push(chat);
    else if (t >= weekStart) thisWeek.push(chat);
    else older.push(chat);
  }

  const groups: Array<{ label: string; chats: T[] }> = [];
  if (today.length) groups.push({ label: "Today", chats: today });
  if (yesterday.length) groups.push({ label: "Yesterday", chats: yesterday });
  if (thisWeek.length) groups.push({ label: "This week", chats: thisWeek });
  if (older.length) groups.push({ label: "Older", chats: older });
  return groups;
}
