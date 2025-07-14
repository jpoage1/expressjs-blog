const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, "favicon-template.html");
  const content = fs.readFileSync(htmlPath, "utf8");

  await page.setContent(content, { waitUntil: "networkidle0" });
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });

  const element = await page.$(".icon");

  const outputDir = path.resolve(__dirname, "../static/favicons");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  await element.screenshot({
    path: path.join(outputDir, "favicon-512.png"),
    omitBackground: true,
  });

  await browser.close();
})();
