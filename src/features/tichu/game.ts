import {
  DEFAULT_TARGET_SCORE,
  TICHU_TEAM_IDS,
} from "./constants";

import type {
  TichuGameResult,
  TichuRoundResult,
  TichuTeamId,
  TichuTeamValues,
} from "./types";

function calculateTotalScores(
  rounds: TichuRoundResult[],
): TichuTeamValues<number> {
  const totalScores: TichuTeamValues<number> = {
    1: 0,
    2: 0,
  };

  for (const round of rounds) {
    for (const teamId of TICHU_TEAM_IDS) {
      totalScores[teamId] += round.roundScores[teamId];
    }
  }

  return totalScores;
}

function determineWinnerTeamId(
  totalScores: TichuTeamValues<number>,
  targetScore: number,
): TichuTeamId | null {
  const team1ReachedTarget =
    totalScores[1] >= targetScore;

  const team2ReachedTarget =
    totalScores[2] >= targetScore;

  const hasReachedTarget =
    team1ReachedTarget || team2ReachedTarget;

  if (!hasReachedTarget) {
    return null;
  }

  if (totalScores[1] === totalScores[2]) {
    return null;
  }

  return totalScores[1] > totalScores[2]
    ? 1
    : 2;
}

export function calculateTichuGame(
  rounds: TichuRoundResult[],
  targetScore = DEFAULT_TARGET_SCORE,
): TichuGameResult {
  const totalScores = calculateTotalScores(rounds);

  const winnerTeamId = determineWinnerTeamId(
    totalScores,
    targetScore,
  );

  return {
    totalScores,
    winnerTeamId,
    isFinished: winnerTeamId !== null,
  };
}