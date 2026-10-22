/** "Just now", "2 min ago", "3 hr ago", "2 days ago". */
export function timeAgo(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** "3:15 PM" */
export function formatClock(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** "Sep 19, 2025" */
export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Sep 19, 2025 · 3:15 PM" */
export function formatDateTime(iso: string): string {
    return `${formatDate(iso)} · ${formatClock(iso)}`;
}

/** Local calendar day as "YYYY-MM-DD" (the format the backend filters use). */
export function toDateKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Today", "Yesterday" or "Mon 6" for a "YYYY-MM-DD" key. */
export function dayLabel(dateKey: string): string {
    const today = new Date();
    if (dateKey === toDateKey(today)) return 'Today';
    if (dateKey === toDateKey(new Date(today.getTime() - 86_400_000))) return 'Yesterday';
    const d = new Date(`${dateKey}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}
