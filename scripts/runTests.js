const Mocha = require("mocha");

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
    await runTestFile("./test/env.test.js", "environment validation tests");
    console.log("✓ Environment validation passed. Running route tests...");

    await runTestFile("./test/routes.test.js", "route tests");
    console.log("✓ All tests passed!");
  } catch (error) {
    console.error("Test execution failed:", error.message);
    process.exit(1);
  }
}

runTests();
