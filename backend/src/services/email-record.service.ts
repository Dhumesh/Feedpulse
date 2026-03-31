import { Email } from "../models/Email";

type EmailRecordInput = {
  email: string;
  source: "registration" | "feedback_submitter" | "feedback_owner";
  userId?: string;
  feedbackId?: string;
};

export const storeEmailRecord = async (input: EmailRecordInput) => {
  if (!input.email) {
    return;
  }

  await Email.create({
    email: input.email,
    source: input.source,
    userId: input.userId,
    feedbackId: input.feedbackId
  });
};
