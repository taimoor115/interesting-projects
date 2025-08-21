const UrlService = require("../../services/url.service");
const AnalyticsService = require("../../services/analytics.service");
module.exports = (app) => {
  const service = new UrlService();
  const analyticsService = new AnalyticsService();
  app.post("/url/create", async (req, res, next) => {
    try {
      const url = await service.CreateUrl(req.body);
      return res.json(url);
    } catch (error) {
      next(error);
    }
  });

  app.get("/:short_code", async (req, res, next) => {
    try {
      const { short_code } = req.params;
      const url = await service.GetUrlByShortCode(short_code);
      if (!url) {
        return res.status(404).json({ error: "Short URL not found" });
      }
  
      const purpose = req.get("Purpose") || req.get("Sec-Purpose") || req.get("X-Moz");
      const isPrefetch = purpose && purpose.toLowerCase().includes("prefetch");
  

      if (!isPrefetch) {
        await analyticsService.CreateAnalytics({
          short_code,
          ip_address: req.ip,
          country: req.country,
          device: req.device,
          referrer: req.get("Referrer"),
        });
      } else {
        console.log("⚠️ Prefetch detected, skipping analytics");
      }
  
      let redirectUrl = url.original_url;
      if (!/^https?:\/\//i.test(redirectUrl)) {
        redirectUrl = "http://" + redirectUrl;
      }
  
      return res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  });
  
};
