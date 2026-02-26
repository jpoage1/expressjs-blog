module.exports = (req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const duration = performance.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} - [TOTAL LATENCY]: ${duration.toFixed(2)}ms`,
    );
  });
  next();
};
