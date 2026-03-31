import { createResponse } from "../utils/api";

describe("createResponse", () => {
  it("returns a successful response payload", () => {
    expect(createResponse(true, { id: "1" }, "Created")).toEqual({
      success: true,
      data: { id: "1" },
      error: null,
      message: "Created"
    });
  });

  it("preserves a provided error code", () => {
    expect(createResponse(false, null, "Invalid input", "VALIDATION_ERROR")).toEqual({
      success: false,
      data: null,
      error: "VALIDATION_ERROR",
      message: "Invalid input"
    });
  });
});
