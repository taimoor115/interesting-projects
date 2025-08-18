const express = require("express");
const httpProxy = require("http-proxy");

const PORT = 8000;
const app = express();
const proxy = httpProxy.createProxy();

const BASE_URI = "";

app.use((req, res) => {
  const hostname = req.hostname;

  const sub_domain = hostname.split(".")[0];

  const redirectTo = `${BASE_URI}${sub_domain}`;

  return proxy.web(req, res, { target: redirectTo, changeOrigin: true });
});


proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});
app.listen(PORT, () => {
  console.warn(`Reverse proxy is running on port ${PORT}`);
});
