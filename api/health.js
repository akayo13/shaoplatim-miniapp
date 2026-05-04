const { sendJson } = require("./_lib/http");

module.exports = function handler(req, res) {
  sendJson(res, 200, {
    ok: true,
    service: "shaoplatim-miniapp",
    runtime: "vercel",
    time: new Date().toISOString(),
  });
};
