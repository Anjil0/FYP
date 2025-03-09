export const convertTo24Hour = (time12h) => {
  if (!time12h) return '';
  
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);

  if (hours === 12) {
    hours = modifier === 'AM' ? 0 : 12;
  } else if (modifier === 'PM') {
    hours = hours + 12;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const isWithinTimeRange = (startTime, endTime) => {
  // Get current time in 24-hour format
  const currentTime = getCurrentTime();
  
  // Convert session times to 24-hour format
  const sessionStart = convertTo24Hour(startTime);
  const sessionEnd = convertTo24Hour(endTime);
  
  // Calculate join time (5 minutes before start)
  const startDate = new Date();
  const [startHours, startMinutes] = sessionStart.split(':');
  startDate.setHours(parseInt(startHours), parseInt(startMinutes) - 5);
  const joinTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;

  console.log('Current Time:', currentTime);
  console.log('Join Time:', joinTime);
  console.log('Session End:', sessionEnd);

  return currentTime >= joinTime && currentTime <= sessionEnd;
};