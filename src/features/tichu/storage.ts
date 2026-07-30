import type { TichuGameState } from "./types";

const STORAGE_KEY = "tichu-game";

export function saveTichuGame(
  game: TichuGameState,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(game),
  );
}

export function loadTichuGame():
  TichuGameState | null {
  const savedGame =
    localStorage.getItem(STORAGE_KEY);

  if (!savedGame) {
    return null;
  }

  try {
    return JSON.parse(
      savedGame,
    ) as TichuGameState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearTichuGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}