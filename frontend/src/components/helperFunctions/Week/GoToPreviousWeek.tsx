import { Dispatch, SetStateAction } from 'react';

// Function to go to the previous week in the calendar
const goToPreviousWeek = (
  availableWeeks: string[], 
  currentWeekKey: string, 
  setCurrentWeekKey: Dispatch<SetStateAction<string>>
) => {
  const currentIndex = availableWeeks.indexOf(currentWeekKey);
  if (currentIndex > 0) {
    setCurrentWeekKey(availableWeeks[currentIndex - 1]);
  }
};

export default goToPreviousWeek;