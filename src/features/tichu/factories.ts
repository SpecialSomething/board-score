import type {
  TichuDeclaration,
  TichuDeclarationType,
  TichuGameResult,
  TichuPlayer,
  TichuRoundInput,
  TichuSeat,
  TichuTeamId,
} from "./types";

export function createTichuPlayer(
  id: string,
  name: string,
  teamId: TichuTeamId,
  seat: TichuSeat,
): TichuPlayer {
  return {
    id,
    name,
    teamId,
    seat,
  };
}

export function createTichuRoundInput(
  round: number,
): TichuRoundInput {
  return {
    round,
    cardScores: {
      1: 0,
      2: 0,
    },
    oneTwoTeamId: null,
    declarations: [],
  };
}

export function createTichuDeclaration(
  playerId: string,
  teamId: TichuTeamId,
  type: TichuDeclarationType,
  success: boolean | null = null,
): TichuDeclaration {
  return {
    playerId,
    teamId,
    type,
    success,
  };
}

export function createInitialTichuGameResult(): TichuGameResult {
  return {
    totalScores: {
      1: 0,
      2: 0,
    },
    winnerTeamId: null,
    isFinished: false,
  };
}