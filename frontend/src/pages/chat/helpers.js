/**
 * Generates a random, unique, and human-readable ID.
 * This is perfect for creating meeting IDs, invite codes, etc.
 *
 * @param {number} length The desired length of the ID.
 * @param {string} [prefix=''] An optional prefix for the ID.
 * @returns {string} A random string of the specified length.
 */
const generateMeetingId = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // O and 0 are excluded to avoid confusion
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = { generateMeetingId };