import { Dispatch, SetStateAction } from 'react';

// Navigate to next week
const goToNextWeek = (
availableWeeks: string[], 
currentWeekKey: string, 
setCurrentWeekKey: Dispatch<SetStateAction<string>>
) => {
const currentIndex = availableWeeks.indexOf(currentWeekKey);
if (currentIndex < availableWeeks.length - 1) {
    setCurrentWeekKey(availableWeeks[currentIndex + 1]);
}
};

export default goToNextWeek;