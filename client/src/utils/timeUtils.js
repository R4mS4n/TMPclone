export const formatTimeAgo = (dateString) => {
  try {
    // Convert the input date string to a Date object
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Handle future dates
    if (diffInSeconds < 0) {
      return 'Just now';
    }
    
    // Time intervals in seconds
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;
    
    // Return appropriate time format based on the difference
    if (diffInSeconds < minute) {
      return diffInSeconds === 1 ? '1 second ago' : `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (diffInSeconds < month) {
      const days = Math.floor(diffInSeconds / day);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (diffInSeconds < year) {
      const months = Math.floor(diffInSeconds / month);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffInSeconds / year);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown time';
  }
}; 