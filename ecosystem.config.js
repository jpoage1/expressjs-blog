module.exports = {
  apps: [
    {
      name: "expressjs-blog",
      script: "./src/app.js",
      instances: 1, // or "max" for cluster mode
      exec_mode: "fork", // or "cluster"
      env: {
        NODE_ENV: "development",
        PORT: 3400,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      ignore_watch: ["node_modules", "logs"],
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      pid_file: "./pids/pm2.pid",
    },
  ],
};
