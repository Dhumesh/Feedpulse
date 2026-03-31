import { sanitizeEmail, sanitizeMultilineText, sanitizeText } from "../utils/sanitize";

describe("sanitize helpers", () => {
  it("normalizes text and strips angle brackets", () => {
    expect(sanitizeText("  Hello   <b>world</b>  ")).toBe("Hello bworld/b");
  });

  it("preserves line breaks for multiline text while trimming", () => {
    expect(sanitizeMultilineText("  One line\r\n<two>\nthree  ")).toBe("One line\ntwo\nthree");
  });

  it("returns lowercase emails", () => {
    expect(sanitizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("returns empty strings for unsupported input", () => {
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeMultilineText(null)).toBe("");
    expect(sanitizeEmail(42)).toBe("");
  });
});
