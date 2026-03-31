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

export const analyzeFeedback = async (title: string, description: string): Promise<AiAnalysis> => {
  const client = getClient();
  if (!client) {
    throw new Error("Gemini API key is not configured");
  }

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = [
    "Analyse this product feedback.",
    "Return ONLY valid JSON with these fields: category, sentiment, priority_score, summary, tags.",
    `Title: ${title}`,
    `Description: ${description}`
  ].join("\n");

  const result = await model.generateContent(prompt);
  const parsed = extractJsonObject(result.response.text());

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
  const client = getClient();
  if (!client) {
    throw new Error("Gemini API key is not configured");
  }

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = [
    "Summarize recent product feedback.",
    "Return ONLY valid JSON with a `themes` array containing exactly 3 short strings.",
    JSON.stringify(items)
  ].join("\n");

  const result = await model.generateContent(prompt);
  const parsed = extractJsonObject(result.response.text());

  return Array.isArray(parsed.themes)
    ? parsed.themes.filter((theme): theme is string => typeof theme === "string").slice(0, 3)
    : [];
};
