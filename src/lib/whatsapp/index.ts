import { Clinic } from "../db/types";
import { WhatsAppProvider } from "./types";
import { MockWhatsAppProvider, mockWhatsAppProvider } from "./mock-provider";
import { MetaCloudWhatsAppProvider } from "./meta-cloud-provider";

export * from "./types";
export * from "./parser";
export * from "./mock-provider";
export * from "./meta-cloud-provider";

/**
 * Returns the appropriate WhatsApp provider for a clinic
 * Falls back to Mock provider in development or when mock mode is enabled
 */
export function getWhatsAppProvider(clinic?: Clinic | null): WhatsAppProvider {
  const isMockMode = process.env.WHATSAPP_MOCK_MODE === "true";

  if (
    isMockMode ||
    !clinic ||
    !clinic.whatsapp_phone_number_id ||
    !clinic.whatsapp_access_token
  ) {
    return mockWhatsAppProvider;
  }

  return new MetaCloudWhatsAppProvider({
    phoneNumberId: clinic.whatsapp_phone_number_id,
    encryptedAccessToken: clinic.whatsapp_access_token,
  });
}
