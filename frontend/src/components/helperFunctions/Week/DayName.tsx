export default function getDayName(day: string) {
    const date = new Date(day);
    // Array of weekday names in Monday-first order
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Get the day of the week (0-6, where 0 is Sunday)
    const weekdayIndex = date.getDay();
    
    // Convert Sunday-first index to Monday-first index (Sunday becomes 6 instead of 0)
    const mondayBasedIndex = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    
    // Return the weekday name
    return weekdays[mondayBasedIndex];
}