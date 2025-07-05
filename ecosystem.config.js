const dotenv = require("dotenv");
dotenv.config(); // optional, if loading .env

function createAppConfig(branch) {
  return {
    name: `expressjs-blog-${branch}`,
    script: "./src/app.js",
    instances: 1,
    exec_mode: "fork",
    ignore_watch: ["pids", "data", "node_modules", "logs"],
    log_date_format: "YYYY-MM-DD HH:mm Z",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    pid_file: "./pids/pm2.pid",
  };
}

module.exports = {
  apps: [createAppConfig("main"), createAppConfig("testing")],
};
