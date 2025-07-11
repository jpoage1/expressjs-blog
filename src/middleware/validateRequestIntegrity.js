const HttpError = require("../utils/HttpError")
module.exports = (req, res, next) => {
  const allowedMethods = ["GET", "POST"];
  const contentLength = parseInt(req.get("content-length") || "0", 10);
  const contentType = req.headers["content-type"] || "";
  const headerCount = Object.keys(req.headers).length;

  if (!allowedMethods.includes(req.method)) {
    return next(
      new HttpError("Method Not Allowed", 405)
    );
  }

  if (contentLength > 4096) {
    return next(
      new HttpError("Payload Too Large", 413)
    );
  }

  if (contentType.includes("multipart/form-data")) {
    return next(
      new HttpError("File uploads are not allowed.", 400)
    );
  }

  if (headerCount > 100) {
    return next(
      new HttpError("Too many headers.", 400)
    );
  }

  next();
};
