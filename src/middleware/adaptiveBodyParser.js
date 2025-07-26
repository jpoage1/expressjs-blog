// src/setupMiddleware.js
const express = require("express");
const { winstonLogger } = require("../utils/logging");

const {
  EXCLUDED_PATHS,
  DATA_LIMIT_BYTES,
  RAW_BODY_LIMIT_BYTES,
  RAW_BODY_TYPE,
  FALLBACK_ENCODING,
  FALLBACK_BODY,
} = require("../constants/middlewareConstants");

// Body parsing with different limits for excluded vs normal paths
module.exports = (req, res, next) => {
  const isExcludedPath = EXCLUDED_PATHS.includes(req.path);
  const limit = isExcludedPath ? RAW_BODY_LIMIT_BYTES : DATA_LIMIT_BYTES;

  const contentType = req.get("content-type") || "";

  if (contentType.includes("application/json")) {
    // Parse JSON with appropriate limit
    express.json({ limit })(req, res, (err) => {
      if (err) {
        winstonLogger.error("JSON parsing error:", err.message);
        return next(err);
      }
      // winstonLogger.debug("Parsed JSON body:", req.body);
      next();
    });
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    // Parse form data with appropriate limit
    express.urlencoded({ extended: false, limit })(req, res, (err) => {
      if (err) {
        winstonLogger.error("Form parsing error:", err.message);
        return next(err);
      }
      // winstonLogger.debug("Parsed form body:", req.body);
      next();
    });
  } else if (contentType.includes("multipart/form-data")) {
    // For multipart, we'd need multer or similar, but pass through for now
    winstonLogger.debug(
      "Multipart form detected - may need additional handling"
    );
    next();
  } else {
    // Try form parsing first (most common for HTML forms), then JSON
    express.urlencoded({ extended: false, limit })(req, res, (formErr) => {
      if (formErr) {
        winstonLogger.warn(
          "Form parsing failed, trying JSON:",
          formErr.message
        );
        express.json({ limit })(req, res, (jsonErr) => {
          if (jsonErr) {
            winstonLogger.error("Both parsers failed:", {
              formErr: formErr.message,
              jsonErr: jsonErr.message,
            });
            return next(jsonErr);
          }
          // winstonLogger.warn("Parsed JSON body (fallback):", req.body);
          next();
        });
      } else {
        // winstonLogger.debug("Parsed form body (default):", req.body);
        next();
      }
    });
  }
};
