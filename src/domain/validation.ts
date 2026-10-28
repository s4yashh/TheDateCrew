import { z } from "zod";
import { JOURNEY_STAGES } from "@/domain/types";

const profileId = z.string().regex(/^(client|candidate)-\d{3}$/, "Invalid demo profile ID.");

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("stage"), profileId, stage: z.enum(JOURNEY_STAGES) }),
  z.object({
    action: z.literal("note"),
    profileId,
    type: z.enum(["Call", "Meeting", "General", "Follow-up"]),
    text: z.string().trim().min(3, "Add a little detail to the note.").max(2000),
  }),
  z.object({ action: z.literal("shortlist"), customerId: profileId, candidateId: profileId }),
  z.object({ action: z.literal("dismiss"), customerId: profileId, candidateId: profileId }),
  z.object({ action: z.literal("restore"), customerId: profileId, candidateId: profileId }),
  z.object({
    action: z.literal("send"),
    customerId: profileId,
    candidateId: profileId,
    introText: z.string().trim().min(10, "Introduction needs at least 10 characters.").max(2000),
  }),
]);

export const matchPairSchema = z.object({ customerId: profileId, candidateId: profileId });
export const introDraftSchema = matchPairSchema;

export type ActionPayload = z.infer<typeof actionSchema>;
