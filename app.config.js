module.exports = ({ config }) => {
  const android = { ...(config.android || {}) };
  const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleMapsKey) {
    android.config = {
      ...(android.config || {}),
      googleMaps: { apiKey: googleMapsKey }
    };
  }
  return { ...config, android };
};
