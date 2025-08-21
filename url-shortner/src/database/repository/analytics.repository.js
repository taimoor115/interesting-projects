const { APIError, STATUS_CODES } = require("../../utils/app-errors");
const analyticsModel = require("../models/analytics.model");

class AnalyticsRepository {
  async CreateAnalytics({ short_code, ip_address, country, device, referrer }) {
    try {
      const analytics = await analyticsModel.create({
        short_code,
        ip_address,
        country,
        device,
        referrer,
      });
      return analytics;
    } catch (error) {
      throw new APIError(
        "DATABASE_ERROR",
        STATUS_CODES.INTERNAL_ERROR,
        error.message
      );
    }
  }

  // Get all analytics for a short_code
  async GetAnalyticsByShortCode(short_code) {
    try {
      const analytics = await analyticsModel.find({ short_code }).sort({ createdAt: -1 });
      return analytics;
    } catch (error) {
      throw new APIError(
        "DATABASE_ERROR",
        STATUS_CODES.INTERNAL_ERROR,
        error.message
      );
    }
  }

  // Count total clicks for a short_code
  async GetClickCount(short_code) {
    try {
      const count = await analyticsModel.countDocuments({ short_code });
      return count;
    } catch (error) {
      throw new APIError(
        "DATABASE_ERROR",
        STATUS_CODES.INTERNAL_ERROR,
        error.message
      );
    }
  }
}

module.exports = AnalyticsRepository;
