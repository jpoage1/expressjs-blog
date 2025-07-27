// combine-css.js
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const atImport = require("postcss-import");

// Define your main CSS entry point file
// This is the file that contains all your @import statements.
const mainCssEntry = path.join(__dirname, "..", "src", "css", "styles.css");

// Define the output path and filename for the combined CSS
const outputDir = path.join(__dirname, "..", "public", "css");
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
/**
 * Main execution logic for the script.
 * This function decides whether to call combineCssImports.
 */
async function main() {
  // Extract arguments passed from the shell script
  // process.argv[0] is 'node', process.argv[1] is 'combine-css.js'
  // So, actual arguments start from index 2
  const oldRev = process.argv[2];
  const newRev = process.argv[3];
  const gitDir = process.argv[4];

  // Condition 1: No arguments passed, force regeneration.
  if (!oldRev && !newRev && !gitDir) {
    console.log("No Git revisions provided. Forcing full CSS bundling.");
    await combineCssImports();
    return;
  }

  // Condition 2: Git revisions are provided, check for updates.
  if (oldRev && newRev && gitDir) {
    // oldRev "0" means it's an initial push or branch creation, so always bundle
    if (oldRev === "0000000000000000000000000000000000000000") {
      console.log(
        "Initial push (old revision is zero). Forcing full CSS bundling."
      );
      await combineCssImports();
      return;
    }

    try {
      // Construct the Git command to check for CSS file changes
      const gitCommand = `git --git-dir="${gitDir}" diff-tree --name-only -r ${oldRev}..${newRev}`;
      console.log(
        `Running Git command to check for CSS changes: ${gitCommand}`
      );

      const changedFiles = execSync(gitCommand, { encoding: "utf8" }).trim();

      // Check if any changed file matches our CSS pattern
      const cssChangeDetected = changedFiles
        .split("\n")
        .some((file) => file.match(/^src\/css\/.*\.css$/));

      if (!cssChangeDetected) {
        console.log(
          "No changes detected in CSS files (src/css/*.css). Skipping CSS bundling."
        );
        return; // Exit without calling combineCssImports
      } else {
        console.log(
          "Changes detected in CSS files. Proceeding with CSS bundling."
        );
        await combineCssImports();
      }
    } catch (gitError) {
      // If git command fails (e.g., bad revisions, repo not found), log and proceed with bundling to be safe.
      console.warn(
        `Warning: Git diff check failed (${gitError.message}). Proceeding with CSS bundling to be safe.`
      );
      await combineCssImports(); // Fallback to bundling if the check fails
    }
    return;
  }

  // Fallback for unexpected argument combinations (e.g., only oldRev provided)
  console.warn(
    "Warning: Unexpected arguments provided to script. Proceeding with CSS bundling to be safe."
  );
  await combineCssImports();
}

// Call the main execution function
main();
