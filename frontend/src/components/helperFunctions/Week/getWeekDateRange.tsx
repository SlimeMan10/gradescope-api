export default function getWeekDateRange(weekKey: string) {
    const monday = new Date(weekKey);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const mondayStr = monday.toLocaleDateString(undefined, options);
    const sundayStr = sunday.toLocaleDateString(undefined, options);
    
    return `${mondayStr} - ${sundayStr}`;
  }