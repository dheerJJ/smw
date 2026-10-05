import { describe, it, expect } from "vitest";
import { parsePatientReply } from "../lib/whatsapp/parser";

describe("WhatsApp Reply Parser", () => {
  it("should parse English confirmation keywords", () => {
    expect(parsePatientReply("YES").intent).toBe("CONFIRM");
    expect(parsePatientReply("yes").intent).toBe("CONFIRM");
    expect(parsePatientReply("Y").intent).toBe("CONFIRM");
    expect(parsePatientReply("confirm").intent).toBe("CONFIRM");
    expect(parsePatientReply("Confirmed").intent).toBe("CONFIRM");
    expect(parsePatientReply("Yes please I will be there").intent).toBe("CONFIRM");
    expect(parsePatientReply("OK").intent).toBe("CONFIRM");
    expect(parsePatientReply("Coming").intent).toBe("CONFIRM");
  });

  it("should parse Hindi confirmation keywords", () => {
    expect(parsePatientReply("हाँ").intent).toBe("CONFIRM");
    expect(parsePatientReply("haan").intent).toBe("CONFIRM");
    expect(parsePatientReply("ha").intent).toBe("CONFIRM");
    expect(parsePatientReply("bilkul").intent).toBe("CONFIRM");
    expect(parsePatientReply("aaunga").intent).toBe("CONFIRM");
  });

  it("should parse cancellation and reschedule requests", () => {
    expect(parsePatientReply("NO").intent).toBe("DECLINE");
    expect(parsePatientReply("no").intent).toBe("DECLINE");
    expect(parsePatientReply("CANCEL").intent).toBe("DECLINE");
    expect(parsePatientReply("please reschedule my appointment").intent).toBe("DECLINE");
    expect(parsePatientReply("Not coming today").intent).toBe("DECLINE");
    expect(parsePatientReply("nahi aaunga").intent).toBe("DECLINE");
    expect(parsePatientReply("postpone to next week").intent).toBe("DECLINE");
  });

  it("should parse opt-out unsubscribe requests strictly", () => {
    expect(parsePatientReply("STOP").intent).toBe("OPT_OUT");
    expect(parsePatientReply("stop").intent).toBe("OPT_OUT");
    expect(parsePatientReply("UNSUBSCRIBE").intent).toBe("OPT_OUT");
    expect(parsePatientReply("unsubscribe").intent).toBe("OPT_OUT");
    expect(parsePatientReply("optout").intent).toBe("OPT_OUT");
    expect(parsePatientReply("dnd").intent).toBe("OPT_OUT");
  });

  it("should categorize unknown text as OTHER", () => {
    expect(parsePatientReply("What is the consultation fee?").intent).toBe("OTHER");
    expect(parsePatientReply("Where is your clinic located?").intent).toBe("OTHER");
    expect(parsePatientReply("").intent).toBe("OTHER");
  });
});
