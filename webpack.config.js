// webpack.config.js
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "production", // or 'development'
  entry: "./public/css/style.css", // Your main CSS file that imports others
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js", // Although this is for JS, Webpack needs an output filename
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // Extracts CSS into a file
          "css-loader", // Interprets @import
          "postcss-loader", // For autoprefixing, etc. (optional)
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "bundle.css", // The name of your output CSS file
    }),
  ],
};
