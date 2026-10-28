import type { TriState } from "@/domain/types";

/**
 * Preferences are Yes / No / Maybe. "Maybe" is a real answer: it signals
 * openness and should never be scored as a mismatch or a hard rejection.
 */
export function triStateFit(preference: TriState | null, target: TriState | null): number | null {
  if (preference === null || target === null) return null;
  if (preference === "Maybe" || target === "Maybe") return 70;
  return preference === target ? 100 : 15;
}

/** Hard-constraint variant used by eligibility checks. */
export function triStateCompatible(preference: TriState | null, target: TriState | null): boolean | null {
  if (preference === null || target === null) return null;
  if (preference === "Maybe" || target === "Maybe") return true;
  return preference === target;
}

/** Symmetric fit between two profile-level answers (pets, relocation). */
export function pairTriStateFit(left: TriState | null, right: TriState | null): number | null {
  if (left === null || right === null) return null;
  if (left === right) return 100;
  if (left === "Maybe" || right === "Maybe") return 70;
  return 25;
}
