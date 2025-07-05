const { config } = require("dotenv");

config = function (branch) {
  return {
    name: `expressjs-blog${branch}`,
    script: "./src/app.js",
    instances: 1, // or "max" for cluster mode
    exec_mode: "fork", // or "cluster"
    ignore_watch: ["pids", "data", "node_modules", "logs"],
    log_date_format: "YYYY-MM-DD HH:mm Z",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    pid_file: "./pids/pm2.pid",
  };
};

module.exports = {
  apps: [config("main"), config("testing")],
};
