// middleware/cacheMiddleware.js
function cacheMiddleware(req, res, next) {
  req.checkCacheHeaders = ({ etag, lastModified }) => {
    const ifNoneMatch = req.headers["if-none-match"];
    const ifModifiedSince = req.headers["if-modified-since"];

    if (ifNoneMatch === etag) {
      res.status(304).end();
      return true;
    }

    if (
      ifModifiedSince &&
      new Date(ifModifiedSince) >= new Date(lastModified)
    ) {
      res.status(304).end();
      return true;
    }

    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", lastModified);
    return false;
  };

  next();
}

module.exports = cacheMiddleware;
