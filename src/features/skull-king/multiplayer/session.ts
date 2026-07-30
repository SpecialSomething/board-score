import { LocalSkullKingMultiplayerSession } from "./types";

const STORAGE_KEY =
  "skull-king-multiplayer-session";

export function saveMultiplayerSession(
  session: LocalSkullKingMultiplayerSession,
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(session),
  );
}

export function loadMultiplayerSession():
  | LocalSkullKingMultiplayerSession
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedSession =
      localStorage.getItem(STORAGE_KEY);

    if (!savedSession) {
      return null;
    }

    return JSON.parse(
      savedSession,
    ) as LocalSkullKingMultiplayerSession;
  } catch {
    return null;
  }
}

export function clearMultiplayerSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}