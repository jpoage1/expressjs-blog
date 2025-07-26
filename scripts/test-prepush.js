const Mocha = require("mocha");
const glob = require("glob").glob;
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function runMochaWithFiles(files, description) {
  console.log(`Running ${description}...`);
  const mocha = new Mocha({
    reporter: "spec",
    timeout: 5000,
  });

  files.forEach((file) => mocha.addFile(file));

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures) {
        reject(new Error(`${description} failed with ${failures} failures`));
      } else {
        resolve();
      }
    });
  });
}

async function findTestFiles(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, files) => {
      if (err) reject(err);
      else resolve(files.map((f) => path.resolve(f)));
    });
  });
}

async function runTests() {
  try {
    const unitTestFiles = await findTestFiles("test/**/*.unit.test.js");
    await runMochaWithFiles(unitTestFiles, "unit tests");

    const propertyTestFiles = await findTestFiles("test/**/*.property.test.js");
    await runMochaWithFiles(propertyTestFiles, "property-based tests");

    const commitHash = execSync("git rev-parse HEAD").toString().trim();
    fs.writeFileSync(".last_tested_commit", commitHash + "\n");

    require("./runTests");
  } catch (err) {
    console.error("Test execution failed:", err.message);
    process.exit(1);
  }
}

runTests();
