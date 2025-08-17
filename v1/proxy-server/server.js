const express = require("express");
const httpProxy = require("http-proxy");

const PORT = 8000;
const app = express();
const proxy = httpProxy.createProxy();

const BASE_URI =
  "https://s3-assets-store.s3.us-east-1.amazonaws.com/__outputs/";

app.use((req, res) => {
  const hostname = req.hostname;

  const sub_domain = hostname.split(".")[0];

  const redirectTo = `${BASE_URI}${sub_domain}`;

  return proxy.web(req, res, { target: redirectTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req) => {
  console.log(`Proxying request for ${req.url} to ${req.headers.host}`);
  const url = req.url;
  if (url === "/") {
    console.log(`Redirecting to ${BASE_URI}`);

    proxyReq.path = `${proxyReq.path}/index.html`;
    console.warn(url);
  }
});
app.listen(PORT, () => {
  console.warn(`Reverse proxy is running on port ${PORT}`);
});
