const Mocha = require("mocha");
const { execSync } = require("child_process");
const fs = require("fs");

const CACHE_FILE = ".last_tested_commit";

function getCurrentCommitHash() {
  return execSync("git rev-parse HEAD").toString().trim();
}

function getLastTestedCommit() {
  try {
    return fs.readFileSync(CACHE_FILE, "utf-8").trim();
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

function cacheTestedCommit(commitHash) {
  fs.writeFileSync(CACHE_FILE, commitHash + "\n");
}

async function runTestFile(filePath, description) {
  console.log(`Running ${description}...`);

  const mocha = new Mocha({
    reporter: "spec",
    timeout: 5000,
  });

  mocha.addFile(filePath);

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

async function runTests() {
  try {
    const commitHash = getCurrentCommitHash();
    const lastCommit = getLastTestedCommit();

    if (lastCommit === commitHash) {
      process.exit(0);
    }

    await runTestFile("./test/env.test.js", "environment validation tests");
    console.log("✓ Environment validation passed. Running route tests...");

    await runTestFile("./test/routes.test.js", "route tests");
    console.log("✓ All tests passed!");
    cacheTestedCommit(commitHash);
  } catch (error) {
    console.error("Test execution failed:", error.message);
    process.exit(1);
  }
}

runTests();
