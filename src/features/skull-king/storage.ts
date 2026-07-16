import type { SkullKingGameState } from "./types";

const STORAGE_KEY = "skull-king-game";

export function saveSkullKingGame(
  game: SkullKingGameState
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(game)
  );
}

export function loadSkullKingGame():
  SkullKingGameState | null {
  const savedGame = localStorage.getItem(STORAGE_KEY);

  if (!savedGame) {
    return null;
  }

  try {
    return JSON.parse(savedGame) as SkullKingGameState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSkullKingGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}