function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let rejected = false;

    req.on("data", (chunk) => {
      if (rejected) return;
      body += chunk;
      if (body.length > 32_768) {
        rejected = true;
        const error = new Error("Request body is too large");
        error.statusCode = 413;
        reject(error);
      }
    });

    req.on("end", () => {
      if (rejected) return;
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        const error = new Error("Invalid JSON");
        error.statusCode = 400;
        reject(error);
      }
    });
  });
}

function methodNotAllowed(res) {
  sendJson(res, 405, { error: "Method not allowed" });
}

module.exports = { methodNotAllowed, readJsonBody, sendJson };
