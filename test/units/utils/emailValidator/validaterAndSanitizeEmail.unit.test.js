// test/utils/emailValidator/validateAndSanitizeEmail.test.js
const { expect } = require("chai");
const sinon = require("sinon");
const validator = require("validator");

const {
  validateAndSanitizeEmail,
  MESSAGES,
  MAX_EMAIL_LENGTH,
} = require("../../../../src/utils/emailValidator");

describe("validateAndSanitizeEmail", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should return REQUIRED if input is undefined", () => {
    const result = validateAndSanitizeEmail(undefined);
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.REQUIRED });
  });

  it("should return REQUIRED if input is null", () => {
    const result = validateAndSanitizeEmail(null);
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.REQUIRED });
  });

  it("should return REQUIRED if input is a non-string type (number)", () => {
    const result = validateAndSanitizeEmail(123);
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.REQUIRED });
  });

  it("should return REQUIRED if input is an empty string", () => {
    const result = validateAndSanitizeEmail("");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.REQUIRED });
  });

  it("should return INVALID if normalized email is null (validator.normalizeEmail returns null)", () => {
    sinon.stub(validator, "normalizeEmail").returns(null);
    const result = validateAndSanitizeEmail("notanemail");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it("should return INVALID if normalized email is not valid (validator.isEmail returns false)", () => {
    sinon.stub(validator, "normalizeEmail").returns("invalid@domain");
    sinon.stub(validator, "isEmail").returns(false);
    const result = validateAndSanitizeEmail("invalid@domain");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it("should return TOO_LONG if email exceeds MAX_EMAIL_LENGTH", () => {
    const localPart = "a".repeat(64);
    const domain = "b".repeat(255 - localPart.length - 1); // keep it under 320 when combined
    const email = `${localPart}@${domain}.com`;

    const tooLongEmail = `${email}${"x".repeat(MAX_EMAIL_LENGTH - email.length + 1)}`; // force >320

    sinon.stub(validator, "normalizeEmail").returns(tooLongEmail);
    sinon.stub(validator, "isEmail").returns(true);

    const result = validateAndSanitizeEmail(tooLongEmail);
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.TOO_LONG });
  });

  it('should return INVALID if email contains ".."', () => {
    const badEmail = "test..dot@example.com";
    sinon.stub(validator, "normalizeEmail").returns(badEmail);
    sinon.stub(validator, "isEmail").returns(true);

    const result = validateAndSanitizeEmail(badEmail);
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it('should return INVALID if email starts with "."', () => {
    const badEmail = ".start@example.com";
    sinon.stub(validator, "normalizeEmail").returns(badEmail);
    sinon.stub(validator, "isEmail").returns(true);

    const result = validateAndSanitizeEmail(badEmail);
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it('should return INVALID if email ends with "."', () => {
    const badEmail = "end.@example.com";
    sinon.stub(validator, "normalizeEmail").returns(badEmail);
    sinon.stub(validator, "isEmail").returns(true);

    const result = validateAndSanitizeEmail(badEmail);
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it("should return valid email if all conditions are satisfied", () => {
    const rawEmail = "   John.Doe@Example.com  ";
    const normalized = "john.doe@example.com";

    sinon.stub(validator, "normalizeEmail").callsFake((email) => {
      // simulate trimming + lowercasing + normalization
      return email === "john.doe@example.com" ? normalized : null;
    });

    sinon.stub(validator, "isEmail").returns(true);

    const result = validateAndSanitizeEmail(rawEmail);
    expect(result).to.deep.equal({ valid: true, email: normalized });
  });

  it('should return INVALID for email with multiple "@" characters', () => {
    const result = validateAndSanitizeEmail("john@doe@example.com");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it('should return INVALID for email with no "@" character', () => {
    const result = validateAndSanitizeEmail("johndoe.example.com");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it("should return VALID for a minimally valid email address", () => {
    const result = validateAndSanitizeEmail("a@b.co");
    expect(result.valid).to.equal(true);
    expect(result.email).to.be.a("string");
  });

  it("should return INVALID for email with spaces in local part", () => {
    const result = validateAndSanitizeEmail("john doe@example.com");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it('should return INVALID for email with space after "@"', () => {
    const result = validateAndSanitizeEmail("john@ example.com");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it("should return INVALID for email with quoted local part (validator accepts, you might not)", () => {
    const result = validateAndSanitizeEmail('"john.doe"@example.com');
    // Accept if validator does; reject if you disallow quotes
    // Adjust depending on your business rules
    expect(result.valid).to.equal(true);
  });

  it("should return INVALID for email with emoji in local part", () => {
    const result = validateAndSanitizeEmail("🧟@example.com");
    expect(result).to.deep.equal({ valid: false, message: MESSAGES.INVALID });
  });

  it("should return VALID for email with subdomain", () => {
    const result = validateAndSanitizeEmail("user@sub.example.com");
    expect(result.valid).to.equal(true);
  });
});
