// constants/httpMessages.js
const HTTP_ERRORS = {
  METHOD_NOT_ALLOWED: (method) => `Http Method '${method}' Not Allowed`,
  PAYLOAD_TOO_LARGE: "Payload Too Large",
  FILE_UPLOADS_NOT_ALLOWED: "File uploads are not allowed.",
  TOO_MANY_HEADERS: "Too many headers.",
};

module.exports = { HTTP_ERRORS };
