export interface SendMessageResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface TemplateVariable {
  type: "text";
  text: string;
}

export interface WhatsAppProvider {
  sendTemplateMessage(
    to: string,
    templateName: string,
    language: "en" | "hi",
    variables: Record<string, string>
  ): Promise<SendMessageResult>;

  sendTextMessage(
    to: string,
    text: string
  ): Promise<SendMessageResult>;
}

export type ParsedIntent = "CONFIRM" | "DECLINE" | "OPT_OUT" | "OTHER";

export interface ParsedReply {
  intent: ParsedIntent;
  originalText: string;
  matchedKeyword?: string;
}
