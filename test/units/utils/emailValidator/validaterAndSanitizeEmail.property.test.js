// test/validateAndSanitizeEmail.fastcheck.test.js
const { expect } = require("chai");
const fc = require("fast-check");
const validator = require("validator");

const {
  validateAndSanitizeEmail,
  MESSAGES,
  MAX_EMAIL_LENGTH,
} = require("../../../../src/utils/emailValidator");

describe("validateAndSanitizeEmail - fast-check property-based tests", () => {
  it("should not throw for arbitrary strings", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const result = validateAndSanitizeEmail(str);
        expect(result).to.have.property("valid").that.is.a("boolean");
        if (result.valid) {
          expect(result).to.have.property("email").that.is.a("string");
          expect(result.email.length).to.be.at.most(MAX_EMAIL_LENGTH);
          expect(validator.isEmail(result.email)).to.equal(true);
        } else {
          expect(result).to.have.property("message").that.is.a("string");
          expect(Object.values(MESSAGES)).to.include(result.message);
        }
      })
    );
  });

  it("should always return valid=true for valid, normalized, RFC-compliant email addresses", () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const result = validateAndSanitizeEmail(email);
        expect(result.valid).to.equal(true);
        expect(result.email).to.be.a("string");
        expect(validator.isEmail(result.email)).to.equal(true);
        expect(result.email.length).to.be.at.most(MAX_EMAIL_LENGTH);
        expect(result.email.includes("..")).to.equal(false);
        expect(result.email.startsWith(".")).to.equal(false);
        expect(result.email.endsWith(".")).to.equal(false);
      })
    );
  });

  it("should reject emails longer than MAX_EMAIL_LENGTH", () => {
    const longLocal = "a".repeat(64);
    const longDomain = "b".repeat(MAX_EMAIL_LENGTH);
    const longEmail = `${longLocal}@${longDomain}.com`; // definitely > 320

    const result = validateAndSanitizeEmail(longEmail);
    expect(result.valid).to.equal(false);
    expect(result.message).to.equal(MESSAGES.TOO_LONG);
  });

  it("should reject strings that normalize to null", () => {
    const nonEmailInput = "invalid input string";

    const result = validateAndSanitizeEmail(nonEmailInput);
    if (result.valid) {
      expect(result.email).to.be.a("string");
    } else {
      expect([MESSAGES.INVALID, MESSAGES.REQUIRED]).to.include(result.message);
    }
  });

  it('should reject emails with ".." in them', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const mutated = email.replace("@", "..@");
        const result = validateAndSanitizeEmail(mutated);
        expect(result.valid).to.equal(false);
        expect(result.message).to.equal(MESSAGES.INVALID);
      })
    );
  });

  it('should reject emails starting or ending with "."', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const startDot = `.${email}`;
        const endDot = `${email}.`;

        const result1 = validateAndSanitizeEmail(startDot);
        const result2 = validateAndSanitizeEmail(endDot);

        expect(result1.valid).to.equal(false);
        expect(result2.valid).to.equal(false);
        expect(result1.message).to.equal(MESSAGES.INVALID);
        expect(result2.message).to.equal(MESSAGES.INVALID);
      })
    );
  });
});
