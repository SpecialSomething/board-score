import type {
  Player,
  RoundPlayer,
  SkullKingBonusInput,
} from "./types";

export function createEmptyBonuses(): SkullKingBonusInput {
  return {
    standardFourteensCount: 0,
    blackFourteenCaptured: false,
    mermaidsCapturedByPirate: 0,
    piratesCapturedBySkullKing: 0,
    skullKingCapturedByMermaid: false,
  };
}

export function createRoundPlayers(
  players: Player[]
): RoundPlayer[] {
  return players.map((player) => ({
    player,
    value: {
      playerId: player.id,
      bid: 0,
      tricks: 0,
      bonuses: createEmptyBonuses(),
    },
  }));
}

export function resetRoundPlayerInputs(
  players: RoundPlayer[]
): RoundPlayer[] {
  return players.map((roundPlayer) => ({
    ...roundPlayer,
    value: {
      ...roundPlayer.value,
      bid: 0,
      tricks: 0,
      bonuses: createEmptyBonuses(),
    },
  }));
}