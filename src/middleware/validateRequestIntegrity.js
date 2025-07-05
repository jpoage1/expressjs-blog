module.exports = (req, res, next) => {
  const allowedMethods = ["GET", "POST"];
  const contentLength = parseInt(req.get("content-length") || "0", 10);
  const contentType = req.headers["content-type"] || "";
  const headerCount = Object.keys(req.headers).length;

  if (!allowedMethods.includes(req.method)) {
    return next(
      Object.assign(new Error("Method Not Allowed"), { statusCode: 405 })
    );
  }

  if (contentLength > 4096) {
    return next(
      Object.assign(new Error("Payload Too Large"), { statusCode: 413 })
    );
  }

  if (contentType.includes("multipart/form-data")) {
    return next(
      Object.assign(new Error("File uploads are not allowed."), {
        statusCode: 400,
      })
    );
  }

  if (headerCount > 100) {
    return next(
      Object.assign(new Error("Too many headers."), { statusCode: 400 })
    );
  }

  next();
};
