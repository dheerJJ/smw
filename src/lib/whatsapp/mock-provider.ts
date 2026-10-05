import { WhatsAppProvider, SendMessageResult } from "./types";

export interface SentMockMessage {
  id: string;
  to: string;
  type: "template" | "text";
  templateName?: string;
  language?: string;
  variables?: Record<string, string>;
  text?: string;
  sentAt: string;
}

export class MockWhatsAppProvider implements WhatsAppProvider {
  public sentMessages: SentMockMessage[] = [];
  public failNextWith?: string;

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: "en" | "hi",
    variables: Record<string, string>
  ): Promise<SendMessageResult> {
    if (this.failNextWith) {
      const err = this.failNextWith;
      this.failNextWith = undefined;
      return { success: false, error: err };
    }

    // Simulate failure for specific test number
    if (to.endsWith("0000")) {
      return {
        success: false,
        error: "Meta Cloud API simulated error: Recipient phone number invalid or not on WhatsApp",
      };
    }

    const id = `wamid_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.sentMessages.push({
      id,
      to,
      type: "template",
      templateName,
      language,
      variables,
      sentAt: new Date().toISOString(),
    });

    return {
      success: true,
      providerMessageId: id,
    };
  }

  async sendTextMessage(to: string, text: string): Promise<SendMessageResult> {
    if (this.failNextWith) {
      const err = this.failNextWith;
      this.failNextWith = undefined;
      return { success: false, error: err };
    }

    const id = `wamid_mock_text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.sentMessages.push({
      id,
      to,
      type: "text",
      text,
      sentAt: new Date().toISOString(),
    });

    return {
      success: true,
      providerMessageId: id,
    };
  }
}

// Global singleton for mock provider
export const mockWhatsAppProvider = new MockWhatsAppProvider();
