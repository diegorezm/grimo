/**
 * An invite opened while signed out survives sign-up (and the Google round trip) here, so the
 * onboarding can put the new reader straight into the group. Per browser, best effort.
 */
const KEY = "grimo.pendingInvite";

export function savePendingInvite(code: string) {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // Private mode or storage blocked: the reader opens the link again after signing up.
  }
}

export function takePendingInvite(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    return code;
  } catch {
    return null;
  }
}
