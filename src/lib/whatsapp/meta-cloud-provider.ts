import { WhatsAppProvider, SendMessageResult } from "./types";
import { decryptText } from "../crypto";

export interface MetaCloudProviderConfig {
  phoneNumberId: string;
  encryptedAccessToken: string;
  apiVersion?: string;
}

/**
 * Official Meta WhatsApp Business Cloud API Provider Implementation
 *
 * NOTE:
 * 1. Business-initiated messages MUST use pre-approved Meta message templates.
 * 2. Free-form text messages (sendTextMessage) are strictly restricted by Meta
 *    to the 24-hour customer-service window following an inbound patient message.
 */
export class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(config: MetaCloudProviderConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = decryptText(config.encryptedAccessToken);
    this.apiVersion = config.apiVersion || process.env.WHATSAPP_API_VERSION || "v19.0";
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: "en" | "hi",
    variables: Record<string, string>
  ): Promise<SendMessageResult> {
    try {
      // Clean recipient phone to digits only (e.g. "919820123456")
      const cleanTo = to.replace(/\+/g, "").replace(/\s/g, "");

      // Format template body parameters in order
      const parameters = Object.values(variables).map((val) => ({
        type: "text",
        text: String(val),
      }));

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "template",
        template: {
          name: templateName,
          language: { code: language === "hi" ? "hi" : "en_US" },
          components: parameters.length > 0 ? [{ type: "body", parameters }] : [],
        },
      };

      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Meta Cloud API HTTP error ${response.status}`;
        console.error("Meta WhatsApp Cloud API error:", data);
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id;
      return { success: true, providerMessageId: messageId };
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Unknown network error";
      console.error("Meta sendTemplateMessage network exception:", err);
      return { success: false, error: errText };
    }
  }

  async sendTextMessage(to: string, text: string): Promise<SendMessageResult> {
    try {
      const cleanTo = to.replace(/\+/g, "").replace(/\s/g, "");

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { body: text },
      };

      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Meta Cloud API HTTP error ${response.status}`;
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id;
      return { success: true, providerMessageId: messageId };
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Unknown network error";
      return { success: false, error: errText };
    }
  }
}
