const Mocha = require("mocha");
const { execSync } = require("child_process");
const fs = require("fs");

module.exports = class TestRunner {
  constructor(cacheFile) {
    this.cacheFile = cacheFile;
  }

  getCurrentCommitHash() {
    return execSync("git rev-parse HEAD").toString().trim();
  }

  getLastTestedCommit() {
    try {
      return fs.readFileSync(this.cacheFile, "utf-8").trim();
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }

  cacheTestedCommit(commitHash) {
    fs.writeFileSync(this.cacheFile, commitHash + "\n");
  }

  runTestFile(filePath, description) {
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

  async run() {
    try {
      const commitHash = this.getCurrentCommitHash();
      const lastCommit = this.getLastTestedCommit();

      if (lastCommit === commitHash) {
        process.exit(0);
      }

      await this.runTestFile(
        "./test/env.test.js",
        "environment validation tests"
      );
      console.log("✓ Environment validation passed. Running route tests...");

      await this.runTestFile("./test/routes.test.js", "route tests");
      console.log("✓ All tests passed!");
      this.cacheTestedCommit(commitHash);
    } catch (error) {
      console.error("Test execution failed:", error.message);
      process.exit(1);
    }
  }
};
