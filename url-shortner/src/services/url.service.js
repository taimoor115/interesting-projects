const CounterRepository = require("../database/repository/counter.repository");
const UrlRepository = require("../database/repository/url.repository");
const { FormateData } = require("../utils");
const { APIError, STATUS_CODES } = require("../utils/app-errors");
const { toBase62 } = require("../utils/base62");

class UrlService {
  constructor() {
    this.repository = new UrlRepository();
    this.counterRepository = new CounterRepository();
  }

  async CreateUrl(userInputs) {
    const { original_url } = userInputs || {};

    if(!original_url){
        throw new APIError(
            "BAD_REQUEST",
            404,
            "Original URL is required"
        )
    }

    try {
      const counter = await this.counterRepository.getNextSequence("url");

      const short_code = toBase62(counter);

      const expires_at = Date.now() + 3600 * 24 * 1000 * 30; 
      const url = await this.repository.CreateUrl({
        original_url,
        short_code,
        expires_at,
      });

      return FormateData(url)
    } catch (error) {
      throw new APIError(
        "DATABASE_ERROR",
        500,
        error.message
      );
    }
  }


  async GetUrlByShortCode(short_code){
    try {
      const url = await this.repository.GetUrlByShortCode(short_code);
      return url
    } catch (error) {
      throw new APIError(
        "DATABASE_ERROR",
        500,
        error.message
      );
    }
  }
}


module.exports = UrlService;
