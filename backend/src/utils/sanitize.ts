const stripAngles = (value: string) => value.replace(/[<>]/g, "").trim();

export const sanitizeText = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return stripAngles(value).replace(/\s+/g, " ");
};

export const sanitizeMultilineText = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return stripAngles(value).replace(/\r/g, "").trim();
};

export const sanitizeEmail = (value: unknown) => sanitizeText(value).toLowerCase();
