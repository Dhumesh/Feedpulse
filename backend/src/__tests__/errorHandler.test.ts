import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

const createResponseDouble = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn()
  };

  response.status.mockReturnValue(response);

  return response;
};

describe("error handlers", () => {
  it("returns a standard 404 payload for unknown routes", () => {
    const res = createResponseDouble();

    notFoundHandler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: "NOT_FOUND",
      message: "Route not found"
    });
  });

  it("returns a standard 500 payload for unhandled errors", () => {
    const res = createResponseDouble();
    const error = new Error("boom");

    errorHandler(error, {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: "boom",
      message: "An unexpected error occurred"
    });
  });
});
