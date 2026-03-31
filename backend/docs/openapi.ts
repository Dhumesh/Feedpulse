import swaggerJSDoc from "swagger-jsdoc";

export const openApiSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "FeedPulse API",
      version: "1.0.0",
      description: "Swagger documentation for testing FeedPulse backend endpoints"
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@feedpulse.local" },
            password: { type: "string", example: "feedpulse-admin" }
          }
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Jane Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", minLength: 6, example: "secret123" }
          }
        },
        FeedbackCreateRequest: {
          type: "object",
          required: ["title", "description", "category"],
          properties: {
            title: { type: "string", maxLength: 120, example: "Dark mode for dashboard" },
            description: {
              type: "string",
              minLength: 20,
              example: "Please add dark mode support to reduce eye strain during night shifts."
            },
            category: {
              type: "string",
              enum: ["Bug", "Feature Request", "Improvement", "Other"]
            },
            submitterName: { type: "string", example: "Jane Doe" },
            submitterEmail: { type: "string", format: "email", example: "jane@example.com" }
          }
        },
        FeedbackStatusUpdateRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["New", "In Review", "Resolved"]
            }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.ts"]
});
