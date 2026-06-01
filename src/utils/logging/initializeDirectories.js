// src/#logging/initializeLogDirectories.js
const fs = require("fs");
const path = require("path");

const { logging } = require("#config");

const { logDir, logFiles } = logging;

// function initializeLogDirectories(baseDir = logDir, files = logFiles) {
//   Object.values(files).forEach((file) => {
//     const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
//     const dir = path.dirname(filePath);

//     if (!fs.existsSync(dir)) {
//       try {
//         fs.mkdirSync(dir, { recursive: true });
//       } catch (error) {
//         console.error(`Failed to create directory ${dir}:`, error);
//         throw error;
//       }
//     }
//   });

//   const functionsLogDir = path.join(logDir, "functions");
//   if (!fs.existsSync(functionsLogDir)) {
//     try {
//       fs.mkdirSync(functionsLogDir, { recursive: true });
//     } catch (error) {
//       console.error(
//         `Failed to create functions directory ${functionsLogDir}:`,
//         error
//       );
//       throw error;
//     }
//   }
//   return functionsLogDir;
// }
function initializeLogDirectories(baseDir = logDir, files = logFiles) {
  // Ensure baseDir exists first
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Create directories for each log file
  Object.values(files).forEach((file) => {
    const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
    const dir = path.dirname(filePath);

    // Remove the problematic console.error debug statements
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create the functions log directory
  const functionsLogDir = path.join(baseDir, "functions");
  if (!fs.existsSync(functionsLogDir)) {
    fs.mkdirSync(functionsLogDir, { recursive: true });
  }

  return functionsLogDir;
}

module.exports = {
  initializeLogDirectories,
};
