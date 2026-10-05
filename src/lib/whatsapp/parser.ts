import { ParsedReply } from "./types";

const OPTOUT_KEYWORDS = [
  "stop messaging",
  "unsubscribe",
  "optout",
  "opt out",
  "stop",
  "block",
  "dnd",
];

const DECLINE_KEYWORDS = [
  "not coming",
  "nahi aaunga",
  "nahi aunga",
  "change time",
  "cant come",
  "cannot come",
  "won't come",
  "wont come",
  "reschedule",
  "postpone",
  "cancel",
  "cancelled",
  "nahi",
  "busy",
  "no",
  "n",
];

const CONFIRM_KEYWORDS = [
  "yes please",
  "will be there",
  "definitely",
  "bilkul",
  "aaunga",
  "aunga",
  "coming",
  "confirm",
  "confirmed",
  "हाँ",
  "haan",
  "yes",
  "y",
  "ok",
  "okay",
  "ha",
];

/**
 * Robust multilingual reply parser for patient WhatsApp messages
 * Accurately parses English, Hindi, and Hinglish responses
 */
export function parsePatientReply(rawText: string): ParsedReply {
  if (!rawText) {
    return { intent: "OTHER", originalText: "" };
  }

  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, " ").replace(/\s+/g, " ").trim();
  const words = lower.split(" ");

  // 1. Check OPT_OUT first for privacy compliance
  for (const kw of OPTOUT_KEYWORDS) {
    if (lower === kw || lower.includes(kw) || words.includes(kw)) {
      return { intent: "OPT_OUT", originalText: trimmed, matchedKeyword: kw };
    }
  }

  // 2. Check DECLINE (NO / RESCHEDULE / CANCEL / NOT COMING)
  // Check DECLINE before CONFIRM so "not coming" is caught as decline rather than "coming"
  for (const kw of DECLINE_KEYWORDS) {
    if (kw.includes(" ") ? lower.includes(kw) : words.includes(kw) || lower === kw) {
      return { intent: "DECLINE", originalText: trimmed, matchedKeyword: kw };
    }
  }

  // 3. Check CONFIRM (YES / CONFIRM / हाँ)
  for (const kw of CONFIRM_KEYWORDS) {
    if (kw.includes(" ") ? lower.includes(kw) : words.includes(kw) || lower === kw) {
      return { intent: "CONFIRM", originalText: trimmed, matchedKeyword: kw };
    }
  }

  return {
    intent: "OTHER",
    originalText: trimmed,
  };
}
