// combine-css.js
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const atImport = require("postcss-import");

// Define your main CSS entry point file
// This is the file that contains all your @import statements.
const mainCssEntry = path.join(__dirname, "src", "css", "styles.css");

// Define the output path and filename for the combined CSS
const outputDir = path.join(__dirname, "public", "css");
const outputFilename = "styles.css";
const outputPath = path.join(outputDir, outputFilename);

async function combineCssImports() {
  console.log(`Starting CSS bundling from: ${mainCssEntry}`);

  try {
    // Read the content of the main CSS file
    const cssContent = fs.readFileSync(mainCssEntry, "utf8");

    // Process with PostCSS and postcss-import plugin
    const result = await postcss([
      atImport({
        // This 'path' option tells postcss-import where to look for imported files.
        // It's crucial for resolving relative paths like "@import './components/header.css';"
        path: [path.join(__dirname, "src", "css")],
      }),
    ]).process(cssContent, {
      from: mainCssEntry, // Tell PostCSS the original file path
      to: outputPath, // Tell PostCSS the output file path (useful for source maps, etc.)
    });

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the combined CSS to the output file
    fs.writeFileSync(outputPath, result.css);
    console.log(`\nSuccessfully combined all imported CSS into: ${outputPath}`);
  } catch (error) {
    console.error("Error combining CSS files:", error);
    if (error.file) {
      console.error(`Error in file: ${error.file}`);
      console.error(
        `At line ${error.line}, column ${error.column}: ${error.reason}`
      );
    }
    process.exit(1); // Exit with an error code
  }
}

combineCssImports();
