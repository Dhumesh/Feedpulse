const generateContentMock = jest.fn();
const getGenerativeModelMock = jest.fn(() => ({
  generateContent: generateContentMock
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: getGenerativeModelMock
  }))
}));

describe("gemini service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses and normalizes Gemini analysis JSON", async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            category: "Feature Request",
            sentiment: "Positive",
            priority_score: 9,
            summary: "Users want dark mode.",
            tags: ["UI", "Accessibility", "Dark Mode"]
          })
      }
    });

    const { analyzeFeedback } = await import("../services/gemini.service");
    const result = await analyzeFeedback(
      "Need dark mode",
      "Please add dark mode support to reduce eye strain at night."
    );

    expect(getGenerativeModelMock).toHaveBeenCalled();
    expect(result).toEqual({
      category: "Feature Request",
      sentiment: "Positive",
      priority_score: 9,
      summary: "Users want dark mode.",
      tags: ["UI", "Accessibility", "Dark Mode"]
    });
  });

  it("falls back to safe defaults when Gemini returns invalid enum values", async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            category: "Strange",
            sentiment: "Mixed",
            priority_score: 99,
            summary: "  Unexpected schema  ",
            tags: ["A", 2, "  ", "B"]
          })
      }
    });

    const { analyzeFeedback } = await import("../services/gemini.service");
    const result = await analyzeFeedback(
      "Odd output",
      "Gemini returned values that do not match the allowed enums at all."
    );

    expect(result).toEqual({
      category: "Other",
      sentiment: "Neutral",
      priority_score: 10,
      summary: "Unexpected schema",
      tags: ["A", "B"]
    });
  });
});
