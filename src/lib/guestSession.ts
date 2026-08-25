/**
 * Guest-side draft state for the stage landing previews.
 *
 * The landing screen and the success screen are rendered in separate preview
 * panels, so what the guest "submitted" lives in a tiny module store instead
 * of component state — that way the success screen can reflect the real
 * arrival time, rating, review text and contact details.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { StageId } from "@/lib/otaJourney";

export type StageDraft = {
  /** Pre-check-in: expected arrival time. */
  arrival: string;
  /** During stay: which hospitality action the guest picked. */
  action: string | null;
  /** During stay: free-text request. */
  request: string;
  /** Post-checkout: 0 = not rated yet. */
  rating: number;
  review: string;
  email: string;
  phone: string;
  address: string;
  submitted: boolean;
};

/** What the OTA already unmasked for Michelle. Address is the missing piece. */
export const GUEST = {
  firstName: "Michelle",
  lastName: "West",
  email: "michelle.west@example.com",
  phone: "+1 (415) 555 0182",
  address: "",
};

const blank = (): StageDraft => ({
  arrival: "3:30 PM",
  action: null,
  request: "",
  rating: 0,
  review: "",
  email: GUEST.email,
  phone: GUEST.phone,
  address: GUEST.address,
  submitted: false,
});

const store: Record<string, StageDraft> = {};
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function read(id: StageId) {
  return (store[id] ??= blank());
}

export function resetStageDraft(id: StageId) {
  store[id] = blank();
  emit();
}

export function useStageDraft(id: StageId) {
  const draft = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(id),
    () => read(id),
  );

  const patch = useCallback(
    (next: Partial<StageDraft>) => {
      store[id] = { ...read(id), ...next };
      emit();
    },
    [id],
  );

  return [draft, patch] as const;
}

export const ARRIVAL_TIMES = [
  "Before 12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:30 PM",
  "5:00 PM",
  "7:00 PM",
  "After 9:00 PM",
];
