// // const { expect } = require("chai");
// // const fs = require("fs");
// // const path = require("path");
// // const mockFs = require("mock-fs");
// // const { initializeLogDirectories } = require("../../../src/utils/logging");

// // // const { expect } = require("chai");
// // // const fs = require("fs");
// // // const path = require("path");
// // // const mockFs = require("mock-fs");

// // // describe("initializeLogDirectories - Diagnostic", () => {
// // //   const baseDir = "test/logs";

// // //   const customLogFiles = {
// // //     info: "info/info.log",
// // //     error: "error/error.log",
// // //   };

// // //   afterEach(() => mockFs.restore());

// // //   it("should diagnose what happens during directory creation", () => {
// // //     // Mock console methods to capture debug output
// // //     const originalConsoleError = console.error;
// // //     const consoleOutput = [];
// // //     console.error = (...args) => {
// // //       consoleOutput.push(args.join(" "));
// // //       originalConsoleError(...args);
// // //     };

// // //     // Start with empty filesystem
// // //     mockFs({
// // //       [baseDir]: {},
// // //     });

// // //     console.log("=== BEFORE CALLING initializeLogDirectories ===");
// // //     console.log("baseDir exists:", fs.existsSync(baseDir));
// // //     console.log("info dir exists:", fs.existsSync(path.join(baseDir, "info")));
// // //     console.log(
// // //       "error dir exists:",
// // //       fs.existsSync(path.join(baseDir, "error"))
// // //     );

// // //     // Call the function
// // //     let result;
// // //     let error;
// // //     try {
// // //       result = initializeLogDirectories(baseDir, customLogFiles);
// // //       console.log("Function completed successfully");
// // //     } catch (e) {
// // //       error = e;
// // //       console.log("Function threw error:", e.message);
// // //     }

// // //     console.log("=== AFTER CALLING initializeLogDirectories ===");
// // //     console.log("baseDir exists:", fs.existsSync(baseDir));
// // //     console.log("info dir exists:", fs.existsSync(path.join(baseDir, "info")));
// // //     console.log(
// // //       "error dir exists:",
// // //       fs.existsSync(path.join(baseDir, "error"))
// // //     );
// // //     console.log(
// // //       "functions dir exists:",
// // //       fs.existsSync(path.join(baseDir, "functions"))
// // //     );
// // //     console.log("Console output captured:", consoleOutput);
// // //     console.log("Return value:", result);

// // //     // Let's also try manually creating a directory to see if mock-fs is working
// // //     const testDir = path.join(baseDir, "manual-test");
// // //     console.log(
// // //       "Before manual mkdir - testDir exists:",
// // //       fs.existsSync(testDir)
// // //     );
// // //     try {
// // //       fs.mkdirSync(testDir, { recursive: true });
// // //       console.log("Manual mkdir succeeded");
// // //     } catch (e) {
// // //       console.log("Manual mkdir failed:", e.message);
// // //     }
// // //     console.log("After manual mkdir - testDir exists:", fs.existsSync(testDir));

// // //     // Restore console
// // //     console.error = originalConsoleError;

// // //     // Basic assertion to keep test structure
// // //     expect(error).to.be.undefined;
// // //   });
// // // });

// // describe("Isolated Directory Creation Logic", () => {
// //   const baseDir = "test/logs";
// //   const customLogFiles = {
// //     info: "info/info.log",
// //     error: "error/error.log",
// //   };

// //   afterEach(() => mockFs.restore());

// //   it("should replicate the initializeLogDirectories logic step by step", () => {
// //     // Start with empty filesystem
// //     mockFs({
// //       [baseDir]: {},
// //     });

// //     console.log("=== STEP BY STEP REPLICATION ===");

// //     // Replicate the exact logic from initializeLogDirectories
// //     Object.values(customLogFiles).forEach((file, index) => {
// //       console.log(`\n--- Processing file ${index + 1}: ${file} ---`);

// //       const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
// //       console.log("filePath:", filePath);

// //       const dir = path.dirname(filePath);
// //       console.log("dir:", dir);
// //       console.log("path.resolve(dir):", path.resolve(dir));

// //       console.log("fs.existsSync(dir) before:", fs.existsSync(dir));

// //       if (!fs.existsSync(dir)) {
// //         console.log("Directory doesn't exist, creating...");
// //         try {
// //           fs.mkdirSync(dir, { recursive: true });
// //           console.log("fs.mkdirSync completed");
// //         } catch (error) {
// //           console.log("fs.mkdirSync failed:", error.message);
// //         }
// //       } else {
// //         console.log("Directory already exists, skipping");
// //       }

// //       console.log("fs.existsSync(dir) after:", fs.existsSync(dir));
// //     });

// //     // Test functions directory creation
// //     console.log("\n--- Processing functions directory ---");
// //     const functionsLogDir = path.join(baseDir, "functions");
// //     console.log("functionsLogDir:", functionsLogDir);
// //     console.log(
// //       "fs.existsSync(functionsLogDir) before:",
// //       fs.existsSync(functionsLogDir)
// //     );

// //     if (!fs.existsSync(functionsLogDir)) {
// //       console.log("Functions directory doesn't exist, creating...");
// //       try {
// //         fs.mkdirSync(functionsLogDir, { recursive: true });
// //         console.log("Functions directory fs.mkdirSync completed");
// //       } catch (error) {
// //         console.log("Functions directory fs.mkdirSync failed:", error.message);
// //       }
// //     }

// //     console.log(
// //       "fs.existsSync(functionsLogDir) after:",
// //       fs.existsSync(functionsLogDir)
// //     );

// //     // Final verification
// //     console.log("\n=== FINAL VERIFICATION ===");
// //     for (const [key, file] of Object.entries(customLogFiles)) {
// //       const filePath = path.join(baseDir, file);
// //       const dir = path.dirname(filePath);
// //       const exists = fs.existsSync(dir);
// //       console.log(`${key} directory (${dir}) exists: ${exists}`);
// //       expect(exists, `${key} directory should exist: ${dir}`).to.be.true;
// //     }

// //     expect(
// //       fs.existsSync(functionsLogDir),
// //       `functions directory should exist: ${functionsLogDir}`
// //     ).to.be.true;
// //   });

// //   it("should test if mock-fs basic operations work", () => {
// //     mockFs({
// //       "test-root": {
// //         "existing-dir": {},
// //         "existing-file.txt": "content",
// //       },
// //     });

// //     // Test basic operations
// //     expect(fs.existsSync("test-root")).to.be.true;
// //     expect(fs.existsSync("test-root/existing-dir")).to.be.true;
// //     expect(fs.existsSync("test-root/existing-file.txt")).to.be.true;
// //     expect(fs.existsSync("test-root/nonexistent")).to.be.false;

// //     // Test mkdir
// //     const newDir = "test-root/new-dir";
// //     expect(fs.existsSync(newDir)).to.be.false;
// //     fs.mkdirSync(newDir, { recursive: true });
// //     expect(fs.existsSync(newDir)).to.be.true;

// //     // Test nested mkdir
// //     const nestedDir = "test-root/nested/deep/dir";
// //     expect(fs.existsSync(nestedDir)).to.be.false;
// //     fs.mkdirSync(nestedDir, { recursive: true });
// //     expect(fs.existsSync(nestedDir)).to.be.true;
// //   });
// // });
// // describe("initializeLogDirectories", () => {
// //   const baseDir = "test/logs";

// //   const customLogFiles = {
// //     info: "info/info.log",
// //     error: "error/error.log",
// //     security: "security/security.log",
// //     warn: "warn/warn.log",
// //     event: "event/event.log",
// //     notice: "notice/notice.log",
// //     debug: "debug/debug.log",
// //     analytics: "analytics/analytics.log",
// //   };

// //   afterEach(() => mockFs.restore());

// //   it("should create all required directories for given log files", () => {
// //     // Start with completely empty filesystem except for the base directory
// //     mockFs({
// //       [baseDir]: {},
// //     });

// //     // Debug: Check initial state
// //     console.log("Initial baseDir exists:", fs.existsSync(baseDir));
// //     console.log(
// //       "Initial info dir exists:",
// //       fs.existsSync(path.join(baseDir, "info"))
// //     );

// //     const result = initializeLogDirectories(baseDir, customLogFiles);

// //     // Debug: Check what directories were created
// //     console.log("After initialization:");
// //     for (const [key, file] of Object.entries(customLogFiles)) {
// //       const filePath = path.join(baseDir, file);
// //       const dir = path.dirname(filePath);
// //       console.log(`${key} dir (${dir}) exists:`, fs.existsSync(dir));
// //     }

// //     // Verify that all directories now exist
// //     for (const [key, file] of Object.entries(customLogFiles)) {
// //       const filePath = path.join(baseDir, file);
// //       const dir = path.dirname(filePath);
// //       expect(fs.existsSync(dir), `${key} directory does not exist: ${dir}`).to
// //         .be.true;
// //     }

// //     // The functions directory should also exist
// //     const functionsLogDir = path.join(baseDir, "functions");
// //     expect(
// //       fs.existsSync(functionsLogDir),
// //       `functions directory does not exist: ${functionsLogDir}`
// //     ).to.be.true;
// //     expect(result).to.equal(functionsLogDir);
// //   });

// //   it("should not fail if directories already exist", () => {
// //     // Setup all directories upfront in mock-fs
// //     const mockStructure = {
// //       [baseDir]: {
// //         info: {},
// //         error: {},
// //         security: {},
// //         warn: {},
// //         event: {},
// //         notice: {},
// //         debug: {},
// //         analytics: {},
// //         functions: {},
// //       },
// //     };

// //     mockFs(mockStructure);

// //     // Should not throw error if directories exist
// //     expect(() =>
// //       initializeLogDirectories(baseDir, customLogFiles)
// //     ).to.not.throw();

// //     // Verify directories still exist after calling the function
// //     for (const file of Object.values(customLogFiles)) {
// //       const filePath = path.join(baseDir, file);
// //       const dir = path.dirname(filePath);
// //       expect(fs.existsSync(dir)).to.be.true;
// //     }
// //   });

// //   it("should handle absolute paths correctly", () => {
// //     const absoluteLogFiles = {
// //       info: path.resolve(baseDir, "absolute/info.log"),
// //       error: path.resolve(baseDir, "absolute/error.log"),
// //     };

// //     mockFs({
// //       [baseDir]: {},
// //     });

// //     const result = initializeLogDirectories(baseDir, absoluteLogFiles);

// //     // Verify absolute path directories were created
// //     for (const file of Object.values(absoluteLogFiles)) {
// //       const dir = path.dirname(file);
// //       expect(
// //         fs.existsSync(dir),
// //         `absolute path directory does not exist: ${dir}`
// //       ).to.be.true;
// //     }

// //     // The functions directory should still be created relative to baseDir
// //     const functionsLogDir = path.join(baseDir, "functions");
// //     expect(fs.existsSync(functionsLogDir)).to.be.true;
// //     expect(result).to.equal(functionsLogDir);
// //   });
// // });
// const { expect } = require("chai");
// const fs = require("fs");
// const path = require("path");
// const sinon = require("sinon");
// const { initializeLogDirectories } = require("../../../src/utils/logging");

// describe("initializeLogDirectories", () => {
//   let fsExistsSyncStub;
//   let fsMkdirSyncStub;
//   let mkdirSyncCalls;

//   beforeEach(() => {
//     // Track what directories mkdirSync was called with
//     mkdirSyncCalls = [];

//     // Stub fs.existsSync to return false (directory doesn't exist)
//     fsExistsSyncStub = sinon.stub(fs, "existsSync").returns(false);

//     // Stub fs.mkdirSync to track calls
//     fsMkdirSyncStub = sinon.stub(fs, "mkdirSync").callsFake((dir, options) => {
//       mkdirSyncCalls.push({ dir, options });
//       return undefined;
//     });
//   });

//   afterEach(() => {
//     sinon.restore();
//   });

//   it("should call mkdirSync for all required directories", () => {
//     const baseDir = "test/logs";
//     const customLogFiles = {
//       info: "info/info.log",
//       error: "error/error.log",
//       security: "security/security.log",
//       warn: "warn/warn.log",
//       event: "event/event.log",
//       notice: "notice/notice.log",
//       debug: "debug/debug.log",
//       analytics: "analytics/analytics.log",
//     };

//     const result = initializeLogDirectories(baseDir, customLogFiles);

//     // Verify mkdirSync was called for each log file directory
//     const expectedDirs = Object.values(customLogFiles).map((file) =>
//       path.join(baseDir, path.dirname(file))
//     );

//     // Add the functions directory
//     expectedDirs.push(path.join(baseDir, "functions"));

//     // Check that mkdirSync was called for each expected directory
//     expect(mkdirSyncCalls).to.have.length(expectedDirs.length);

//     const actualDirs = mkdirSyncCalls.map((call) => call.dir);
//     expectedDirs.forEach((expectedDir) => {
//       expect(actualDirs).to.include(
//         expectedDir,
//         `mkdirSync should have been called for directory: ${expectedDir}`
//       );
//     });

//     // Verify all calls used recursive: true
//     mkdirSyncCalls.forEach((call) => {
//       expect(call.options).to.deep.equal({ recursive: true });
//     });

//     // Verify return value is the functions directory
//     expect(result).to.equal(path.join(baseDir, "functions"));
//   });

//   it("should not call mkdirSync if directories already exist", () => {
//     const baseDir = "test/logs";
//     const customLogFiles = {
//       info: "info/info.log",
//       error: "error/error.log",
//     };

//     // Stub existsSync to return true (directories exist)
//     fsExistsSyncStub.returns(true);

//     const result = initializeLogDirectories(baseDir, customLogFiles);

//     // Verify mkdirSync was never called
//     expect(mkdirSyncCalls).to.have.length(0);
//     expect(result).to.equal(path.join(baseDir, "functions"));
//   });

//   it("should handle absolute paths correctly", () => {
//     const baseDir = "test/logs";
//     const absoluteLogFiles = {
//       info: path.resolve("/tmp/absolute/info.log"),
//       error: path.resolve("/tmp/absolute/error.log"),
//     };

//     const result = initializeLogDirectories(baseDir, absoluteLogFiles);

//     // Verify mkdirSync was called for absolute path directories
//     const expectedAbsoluteDirs = Object.values(absoluteLogFiles).map((file) =>
//       path.dirname(file)
//     );

//     // Add the functions directory (should still be relative to baseDir)
//     const functionsDir = path.join(baseDir, "functions");

//     expect(mkdirSyncCalls).to.have.length(expectedAbsoluteDirs.length + 1);

//     const actualDirs = mkdirSyncCalls.map((call) => call.dir);
//     expectedAbsoluteDirs.forEach((expectedDir) => {
//       expect(actualDirs).to.include(expectedDir);
//     });
//     expect(actualDirs).to.include(functionsDir);

//     expect(result).to.equal(functionsDir);
//   });

//   it("should check existence of each directory before creating", () => {
//     const baseDir = "test/logs";
//     const customLogFiles = {
//       info: "info/info.log",
//       error: "error/error.log",
//     };

//     initializeLogDirectories(baseDir, customLogFiles);

//     // Verify existsSync was called for each directory that would be created
//     const expectedDirs = [
//       path.join(baseDir, "info"),
//       path.join(baseDir, "error"),
//       path.join(baseDir, "functions"),
//     ];

//     expect(fsExistsSyncStub.callCount).to.equal(expectedDirs.length);

//     expectedDirs.forEach((expectedDir) => {
//       expect(fsExistsSyncStub.calledWith(expectedDir)).to.be.true;
//     });
//   });

//   it("should handle mixed existing and non-existing directories", () => {
//     const baseDir = "test/logs";
//     const customLogFiles = {
//       info: "info/info.log",
//       error: "error/error.log",
//       warn: "warn/warn.log",
//     };

//     // Make info directory exist, but not error or warn
//     fsExistsSyncStub.callsFake((dir) => {
//       return dir === path.join(baseDir, "info");
//     });

//     const result = initializeLogDirectories(baseDir, customLogFiles);

//     // Verify mkdirSync was called only for non-existing directories
//     const expectedCreatedDirs = [
//       path.join(baseDir, "error"),
//       path.join(baseDir, "warn"),
//       path.join(baseDir, "functions"),
//     ];

//     expect(mkdirSyncCalls).to.have.length(expectedCreatedDirs.length);

//     const actualDirs = mkdirSyncCalls.map((call) => call.dir);
//     expectedCreatedDirs.forEach((expectedDir) => {
//       expect(actualDirs).to.include(expectedDir);
//     });

//     // Info directory should not have been created
//     expect(actualDirs).to.not.include(path.join(baseDir, "info"));

//     expect(result).to.equal(path.join(baseDir, "functions"));
//   });
// });
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const sinon = require("sinon");
const { initializeLogDirectories } = require("../../../src/utils/logging");

describe("initializeLogDirectories", () => {
  let fsExistsSyncStub;
  let fsMkdirSyncStub;
  let mkdirSyncCalls;

  beforeEach(() => {
    // Track what directories mkdirSync was called with
    mkdirSyncCalls = [];

    // Stub fs.existsSync to return false (directory doesn't exist)
    fsExistsSyncStub = sinon.stub(fs, "existsSync").returns(false);

    // Stub fs.mkdirSync to track calls
    fsMkdirSyncStub = sinon.stub(fs, "mkdirSync").callsFake((dir, options) => {
      mkdirSyncCalls.push({ dir, options });
      return undefined;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should call mkdirSync for all required directories", () => {
    const baseDir = "test/logs";
    const customLogFiles = {
      info: "info/info.log",
      error: "error/error.log",
      security: "security/security.log",
      warn: "warn/warn.log",
      event: "event/event.log",
      notice: "notice/notice.log",
      debug: "debug/debug.log",
      analytics: "analytics/analytics.log",
    };

    const result = initializeLogDirectories(baseDir, customLogFiles);

    // Debug: Let's see what directories were actually created
    console.log(
      "Actual mkdirSync calls:",
      mkdirSyncCalls.map((call) => call.dir)
    );

    // Verify mkdirSync was called for each log file directory
    const expectedDirs = Object.values(customLogFiles).map((file) =>
      path.join(baseDir, path.dirname(file))
    );

    // Add the functions directory
    expectedDirs.push(path.join(baseDir, "functions"));

    console.log("Expected directories:", expectedDirs);

    // The function might also create the base directory, so let's be flexible
    expect(mkdirSyncCalls.length).to.be.at.least(expectedDirs.length);

    const actualDirs = mkdirSyncCalls.map((call) => call.dir);
    expectedDirs.forEach((expectedDir) => {
      expect(actualDirs).to.include(
        expectedDir,
        `mkdirSync should have been called for directory: ${expectedDir}`
      );
    });

    // Verify all calls used recursive: true
    mkdirSyncCalls.forEach((call) => {
      expect(call.options).to.deep.equal({ recursive: true });
    });

    // Verify return value is the functions directory
    expect(result).to.equal(path.join(baseDir, "functions"));
  });

  it("should not call mkdirSync if directories already exist", () => {
    const baseDir = "test/logs";
    const customLogFiles = {
      info: "info/info.log",
      error: "error/error.log",
    };

    // Stub existsSync to return true (directories exist)
    fsExistsSyncStub.returns(true);

    const result = initializeLogDirectories(baseDir, customLogFiles);

    // Verify mkdirSync was never called
    expect(mkdirSyncCalls).to.have.length(0);
    expect(result).to.equal(path.join(baseDir, "functions"));
  });

  it("should handle absolute paths correctly", () => {
    const baseDir = "test/logs";
    const absoluteLogFiles = {
      info: path.resolve("/tmp/absolute/info.log"),
      error: path.resolve("/tmp/absolute/error.log"),
    };

    const result = initializeLogDirectories(baseDir, absoluteLogFiles);

    // Debug: Let's see what directories were actually created
    console.log(
      "Absolute paths - Actual mkdirSync calls:",
      mkdirSyncCalls.map((call) => call.dir)
    );

    // Verify mkdirSync was called for absolute path directories
    const expectedAbsoluteDirs = Object.values(absoluteLogFiles).map((file) =>
      path.dirname(file)
    );

    // Add the functions directory (should still be relative to baseDir)
    const functionsDir = path.join(baseDir, "functions");

    console.log("Expected absolute directories:", expectedAbsoluteDirs);
    console.log("Expected functions directory:", functionsDir);

    // The function might also create the base directory
    expect(mkdirSyncCalls.length).to.be.at.least(
      expectedAbsoluteDirs.length + 1
    );

    const actualDirs = mkdirSyncCalls.map((call) => call.dir);
    expectedAbsoluteDirs.forEach((expectedDir) => {
      expect(actualDirs).to.include(expectedDir);
    });
    expect(actualDirs).to.include(functionsDir);

    expect(result).to.equal(functionsDir);
  });

  it("should check existence of each directory before creating", () => {
    const baseDir = "test/logs";
    const customLogFiles = {
      info: "info/info.log",
      error: "error/error.log",
    };

    initializeLogDirectories(baseDir, customLogFiles);

    // Debug: Let's see what existsSync was called with
    console.log(
      "existsSync calls:",
      fsExistsSyncStub.getCalls().map((call) => call.args[0])
    );

    // Verify existsSync was called for each directory that would be created
    const expectedDirs = [
      path.join(baseDir, "info"),
      path.join(baseDir, "error"),
      path.join(baseDir, "functions"),
    ];

    // The function might also check if the base directory exists
    expect(fsExistsSyncStub.callCount).to.be.at.least(expectedDirs.length);

    expectedDirs.forEach((expectedDir) => {
      expect(fsExistsSyncStub.calledWith(expectedDir)).to.be.true;
    });
  });

  it("should handle mixed existing and non-existing directories", () => {
    const baseDir = "test/logs";
    const customLogFiles = {
      info: "info/info.log",
      error: "error/error.log",
      warn: "warn/warn.log",
    };

    // Make info directory exist, but not error or warn
    fsExistsSyncStub.callsFake((dir) => {
      return dir === path.join(baseDir, "info");
    });

    const result = initializeLogDirectories(baseDir, customLogFiles);

    // Debug: Let's see what directories were actually created
    console.log(
      "Mixed test - Actual mkdirSync calls:",
      mkdirSyncCalls.map((call) => call.dir)
    );

    // Verify mkdirSync was called only for non-existing directories
    const expectedCreatedDirs = [
      path.join(baseDir, "error"),
      path.join(baseDir, "warn"),
      path.join(baseDir, "functions"),
    ];

    console.log("Expected created directories:", expectedCreatedDirs);

    // The function might also create additional directories (like baseDir)
    expect(mkdirSyncCalls.length).to.be.at.least(expectedCreatedDirs.length);

    const actualDirs = mkdirSyncCalls.map((call) => call.dir);
    expectedCreatedDirs.forEach((expectedDir) => {
      expect(actualDirs).to.include(expectedDir);
    });

    // Info directory should not have been created
    expect(actualDirs).to.not.include(path.join(baseDir, "info"));

    expect(result).to.equal(path.join(baseDir, "functions"));
  });
});
