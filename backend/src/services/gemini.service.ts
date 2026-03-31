import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import {
  FeedbackCategory,
  FeedbackSentiment,
  feedbackCategories,
  feedbackSentiments
} from "../types/feedback";

type AiAnalysis = {
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  priority_score: number;
  summary: string;
  tags: string[];
};

type GenerateJsonOptions = {
  fallbackToSecondaryModel?: boolean;
};

let genAI: GoogleGenerativeAI | null = null;

const getClient = () => {
  if (!env.geminiApiKey) {
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
  }

  return genAI;
};

const extractJsonObject = (value: string) => {
  const match = value.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Gemini response did not include JSON");
  }

  return JSON.parse(match[0]) as Partial<AiAnalysis> & { themes?: unknown };
};

const normalizeCategory = (value: unknown): FeedbackCategory => {
  return feedbackCategories.includes(value as FeedbackCategory)
    ? (value as FeedbackCategory)
    : "Other";
};

const normalizeSentiment = (value: unknown): FeedbackSentiment => {
  return feedbackSentiments.includes(value as FeedbackSentiment)
    ? (value as FeedbackSentiment)
    : "Neutral";
};

const sleep = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const isRetryableGeminiError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("temporar") ||
    message.includes("overloaded") ||
    message.includes("timeout") ||
    message.includes("429") ||
    message.includes("rate limit")
  );
};

const buildModelCandidates = (fallbackToSecondaryModel: boolean) => {
  const models = [env.geminiModel];

  if (fallbackToSecondaryModel && env.geminiFallbackModel && env.geminiFallbackModel !== env.geminiModel) {
    models.push(env.geminiFallbackModel);
  }

  return models;
};

const generateJson = async (
  prompt: string,
  options: GenerateJsonOptions = {}
) => {
  const client = getClient();
  if (!client) {
    throw new Error("Gemini API key is not configured");
  }

  const models = buildModelCandidates(options.fallbackToSecondaryModel ?? true);
  let lastError: unknown;

  for (const modelName of models) {
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    for (let attempt = 0; attempt <= env.geminiRetryCount; attempt += 1) {
      try {
        const result = await model.generateContent(prompt);
        return extractJsonObject(result.response.text());
      } catch (error) {
        lastError = error;
        const canRetry = isRetryableGeminiError(error);
        const hasAnotherAttempt = attempt < env.geminiRetryCount;

        if (!canRetry || !hasAnotherAttempt) {
          break;
        }

        await sleep(env.geminiRetryBaseDelayMs * 2 ** attempt);
      }
    }
  }

  throw new Error(
    `Gemini request failed after retries${models.length > 1 ? ` across models (${models.join(", ")})` : ""}: ${getErrorMessage(lastError)}`
  );
};

export const analyzeFeedback = async (title: string, description: string): Promise<AiAnalysis> => {
  const prompt = [
    "Analyse this product feedback.",
    "Return ONLY valid JSON with these fields: category, sentiment, priority_score, summary, tags.",
    `Title: ${title}`,
    `Description: ${description}`
  ].join("\n");

  const parsed = await generateJson(prompt);

  return {
    category: normalizeCategory(parsed.category),
    sentiment: normalizeSentiment(parsed.sentiment),
    priority_score: Math.max(1, Math.min(10, Number(parsed.priority_score) || 1)),
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
    tags: Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 8)
      : []
  };
};

export const summarizeThemes = async (
  items: Array<{ title: string; description: string; summary?: string }>
) => {
  const prompt = [
    "Summarize recent product feedback.",
    "Return ONLY valid JSON with a `themes` array containing exactly 3 short strings.",
    JSON.stringify(items)
  ].join("\n");

  const parsed = await generateJson(prompt);

  return Array.isArray(parsed.themes)
    ? parsed.themes.filter((theme): theme is string => typeof theme === "string").slice(0, 3)
    : [];
};
