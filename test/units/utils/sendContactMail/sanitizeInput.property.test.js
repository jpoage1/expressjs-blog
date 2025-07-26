const { expect } = require("chai");
const fc = require("fast-check");
const { sanitizeInput } = require("../../../../src/utils/sendContactMail");

describe("sanitizeInput", () => {
  it("should remove all newline, carriage return, and angle brackets", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const result = sanitizeInput(str);
        expect(result).to.not.include("\r");
        expect(result).to.not.include("\n");
        expect(result).to.not.include("<");
        expect(result).to.not.include(">");
      })
    );
  });

  it("should return a string for any input", () => {
    fc.assert(
      fc.property(
        fc.anything(), // This can generate any value, including complex objects
        (input) => {
          const result = sanitizeInput(input);
          expect(typeof result).to.equal("string");
        }
      )
    );
  });

  it("should preserve safe characters when only safe characters are present", () => {
    fc.assert(
      fc.property(
        fc.string({
          // ONLY include characters that won't be filtered out
          // Explicitly exclude: \r, \n, <, >
          minLength: 0, // Allow empty string
          maxLength: 100, // Or some reasonable max length for your test
          // Generate strings of characters that are NOT \r, \n, <, or >
          // We'll filter the characters after generation
          // For individual characters, you'd typically generate a string of length 1
          // and then map/filter the characters from that string.
          // A common pattern is to use fc.array(fc.char()), but fc.char() doesn't exist.
          // So, we'll generate strings with specific character sets, or filter a broader set.
        }),
        (input) => {
          // Filter the input string to ensure it only contains allowed characters
          // This is a common pattern when specific character sets are needed
          const filteredInput = [...input]
            .filter((c) => !["\r", "\n", "<", ">"].includes(c))
            .join("");

          const result = sanitizeInput(filteredInput); // Pass the filtered input to your sanitize function
          expect(result).to.equal(filteredInput.trim());
        }
      )
    );
  });

  // You might still want a separate test for only "safe" characters
  // where it confirms that characters *not* in the removal list are preserved.
  it("should preserve characters NOT in the removal list when only such characters are present", () => {
    fc.assert(
      fc.property(
        fc.string({
          // ONLY include characters that *should not* be filtered out
          characters:
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;'\":,./?`~ \t", // Excludes \r, \n, <, >
        }),
        (input) => {
          if (/[<>\r\n]/.test(input)) fc.pre(false);
          const result = sanitizeInput(input);
          // For inputs that *only* contain allowed characters,
          // the result should simply be the trimmed version of the input.
          expect(result).to.equal(input.trim());
        }
      )
    );
  });

  it("should remove carriage returns, newlines, angle brackets, and trim whitespace", () => {
    fc.assert(
      fc.property(
        fc.string({
          // Include characters that are *expected* to be removed by sanitizeInput
          // along with regular safe characters to ensure comprehensive testing.
          characters:
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$%^&*()_+-=[]{}|;':\",./?`~<>\\r\\n \t", // Added spaces and tabs for trim testing
        }),
        (input) => {
          const result = sanitizeInput(input);

          // Manually apply the *expected* sanitization logic to create the expected output.
          // This should match precisely what sanitizeInput is designed to do.
          const expectedOutput = String(input)
            .replace(/[\r\n<>]/g, "") // Remove \r, \n, <, >
            .trim(); // Trim whitespace

          expect(result).to.equal(expectedOutput);
        }
      )
    );
  });

  it("should remove dangerous characters from any string", () => {
    fc.assert(
      fc.property(
        fc.string(), // Any string
        (input) => {
          const result = sanitizeInput(input);

          // Result should be a string
          expect(typeof result).to.equal("string");

          // Result should not contain dangerous characters
          expect(result).to.not.include("\r");
          expect(result).to.not.include("\n");
          expect(result).to.not.include("<");
          expect(result).to.not.include(">");

          // Result should be trimmed
          expect(result).to.equal(result.trim());
        }
      )
    );
  });

  it("should handle edge cases correctly", () => {
    const testCases = [
      { input: "", expected: "" },
      { input: null, expected: "null" },
      { input: undefined, expected: "undefined" },
      { input: "   ", expected: "" },
      { input: "hello<script>", expected: "helloscript" },
      { input: "  hello world  ", expected: "hello world" },
      { input: "line1\nline2\rline3", expected: "line1line2line3" },
      { input: "<>", expected: "" },
      { input: "\r\n", expected: "" },
      { input: 123, expected: "123" },
      { input: true, expected: "true" },
      { input: {}, expected: "[object Object]" },
      { input: [], expected: "" },
    ];

    testCases.forEach(({ input, expected }) => {
      expect(sanitizeInput(input)).to.equal(expected);
    });
  });

  it("should handle objects that cause String() conversion issues", () => {
    // Test objects that might cause conversion problems
    const problematicInputs = [
      { toString: "" }, // Empty toString
      { toString: null },
      { toString: undefined },
      { valueOf: "" },
      Object.create(null), // Object with no prototype
    ];

    problematicInputs.forEach((input) => {
      expect(() => sanitizeInput(input)).to.not.throw();
      expect(typeof sanitizeInput(input)).to.equal("string");
    });
  });

  it("should trim leading and trailing whitespace", () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const input = `   ${raw}   `;
        const result = sanitizeInput(input);
        expect(result.startsWith(" ")).to.be.false;
        expect(result.endsWith(" ")).to.be.false;
      })
    );
  });
});
