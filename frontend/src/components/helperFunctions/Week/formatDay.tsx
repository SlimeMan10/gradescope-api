export default function formatDate(dateStr: string): string {
    console.log("Before date string formatted", dateStr);
    const date = new Date(dateStr);
    const ans = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    console.log("date string formatted", ans);
    return ans;
}