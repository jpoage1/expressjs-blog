const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const source = path.resolve(__dirname, "../static/favicons/favicon-512.png");
const outputDir = path.resolve(__dirname, "../static/favicons");

const sizes = [16, 32, 48, 64, 192];
sizes.forEach((size) => {
  sharp(source)
    .resize(size, size)
    .toFile(path.join(outputDir, `favicon-${size}x${size}.png`))
    .catch(console.error);
});

sharp(source)
  .resize(48, 48)
  .toFile(path.join(outputDir, "favicon-48x48.png"))
  .then(() => {
    const ico = require("to-ico");
    const buffers = [
      fs.readFileSync(path.join(outputDir, "favicon-16x16.png")),
      fs.readFileSync(path.join(outputDir, "favicon-32x32.png")),
      fs.readFileSync(path.join(outputDir, "favicon-48x48.png")),
    ];
    return ico(buffers);
  })
  .then((buf) => {
    fs.writeFileSync(path.join(outputDir, "favicon.ico"), buf);
  })
  .catch(console.error);
