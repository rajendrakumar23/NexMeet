// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Format duration in minutes to HH:MM
const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h > 0 ? h + 'h ' : ''}${m}m`;
};

module.exports = { generateOTP, formatDuration };
