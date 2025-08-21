const { APIError, STATUS_CODES } = require("../../utils/app-errors");
const UrlModel = require("../models/url.model");

class UrlRepository {
  async CreateUrl({ original_url, short_code, expires_at }) {
    console.log('Creating URL with:', { original_url, short_code, expires_at });
    
    try {
      const url = await UrlModel.create({
        short_code,
        original_url,
        expiresAt: expires_at
      });

      if (!url) {
        throw new APIError(
          "DATABASE_ERROR",
          STATUS_CODES.INTERNAL_ERROR,
          "Failed to create URL"
        );
      }

      return url;
    } catch (error) {
      console.error('Error in CreateUrl:', error);
      
      if (error.code === 11000) {
        throw new APIError(
          "DUPLICATE_SHORT_CODE",
          STATUS_CODES.BAD_REQUEST,
          "Short code already exists"
        );
      }

      throw new APIError(
        "DATABASE_ERROR",
        STATUS_CODES.INTERNAL_ERROR,
        error.message
      );
    }
  }

  async GetUrlByShortCode(short_code) {
    try {
      return await UrlModel.findOne({ short_code });
    } catch (error) {
      console.error('Error in GetUrlByShortCode:', error);
      throw new APIError(
        "DATABASE_ERROR",
        STATUS_CODES.INTERNAL_ERROR,
        error.message
      );
    }
  }

  async DeleteExpiredUrls() {
    try {
      const now = new Date();
      return await UrlModel.deleteMany({ 
        expiresAt: { 
          $lte: now 
        } 
      });
    } catch (error) {
      console.error('Error in DeleteExpiredUrls:', error);
      throw new APIError(
        "DATABASE_ERROR",
        STATUS_CODES.INTERNAL_ERROR,
        error.message
      );
    }
  }
}

module.exports = UrlRepository;
