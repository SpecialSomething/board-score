export type RecentGameType =
  | "skull-king-single"
  | "skull-king-multi"
  | "tichu";

type RecentGamePointer = {
  type: RecentGameType;
  updatedAt: number;
};

const RECENT_GAME_KEY =
  "board-score-recent-game";

export function saveRecentGame(
  type: RecentGameType,
) {
  const recentGame: RecentGamePointer = {
    type,
    updatedAt: Date.now(),
  };

  localStorage.setItem(
    RECENT_GAME_KEY,
    JSON.stringify(recentGame),
  );
}

export function loadRecentGame():
  RecentGamePointer | null {
  const saved =
    localStorage.getItem(RECENT_GAME_KEY);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(
      saved,
    ) as RecentGamePointer;
  } catch {
    localStorage.removeItem(
      RECENT_GAME_KEY,
    );
    return null;
  }
}

export function clearRecentGame() {
  localStorage.removeItem(
    RECENT_GAME_KEY,
  );
}