const AnalyticsRepository = require("../database/repository/analytics.repository");
const { APIError, STATUS_CODES } = require("../utils/app-errors");

class AnalyticsService {
    constructor() {
        this.repository = new AnalyticsRepository();
    }

    async CreateAnalytics({ short_code, ip_address, country, device, referrer }) {
        try {
            const analytics = await this.repository.CreateAnalytics({
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

    async GetAnalyticsByShortCode(short_code) {
        try {
            const analytics = await this.repository.GetAnalyticsByShortCode(short_code);
            return analytics;
        } catch (error) {
            throw new APIError(
                "DATABASE_ERROR",
                STATUS_CODES.INTERNAL_ERROR,
                error.message
            );
        }
    }

    async GetClickCount(short_code) {
        try {
            const count = await this.repository.GetClickCount(short_code);
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

module.exports = AnalyticsService;
