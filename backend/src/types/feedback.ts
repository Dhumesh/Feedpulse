export const feedbackCategories = [
  "Bug",
  "Feature Request",
  "Improvement",
  "Other"
] as const;

export const feedbackStatuses = [
  "New",
  "In Review",
  "Resolved"
] as const;

export const feedbackSentiments = [
  "Positive",
  "Neutral",
  "Negative"
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number];
export type FeedbackStatus = (typeof feedbackStatuses)[number];
export type FeedbackSentiment = (typeof feedbackSentiments)[number];
