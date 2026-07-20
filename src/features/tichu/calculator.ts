import {
  GRAND_TICHU_SCORE,
  ONE_TWO_SCORE,
  SMALL_TICHU_SCORE,
  TICHU_TEAM_IDS,
} from "./constants";

import type {
  TichuDeclaration,
  TichuRoundInput,
  TichuRoundResult,
  TichuTeamValues,
} from "./types";

function calculateDeclarationScore(
  declaration: TichuDeclaration,
): number {
  const baseScore =
    declaration.type === "grand-tichu"
      ? GRAND_TICHU_SCORE
      : SMALL_TICHU_SCORE;

  if (declaration.success === null) {
    throw new Error(
      "선언 결과가 입력되지 않았습니다.",
    );
  }
  
  return declaration.success
    ? baseScore
    : -baseScore;
}

function calculateDeclarationScores(
  declarations: TichuDeclaration[],
): TichuTeamValues<number> {
  const declarationScores: TichuTeamValues<number> = {
    1: 0,
    2: 0,
  };

  for (const declaration of declarations) {
    declarationScores[declaration.teamId] +=
      calculateDeclarationScore(declaration);
  }

  return declarationScores;
}

function calculateCardScores(
  input: TichuRoundInput,
): TichuTeamValues<number> {
  if (input.oneTwoTeamId === null) {
    return {
      ...input.cardScores,
    };
  }

  return {
    1:
      input.oneTwoTeamId === 1
        ? ONE_TWO_SCORE
        : 0,

    2:
      input.oneTwoTeamId === 2
        ? ONE_TWO_SCORE
        : 0,
  };
}

export function calculateTichuRound(
  input: TichuRoundInput,
): TichuRoundResult {
  const cardScores = calculateCardScores(input);

  const declarationScores =
    calculateDeclarationScores(
      input.declarations,
    );

  const roundScores: TichuTeamValues<number> = {
    1: 0,
    2: 0,
  };

  for (const teamId of TICHU_TEAM_IDS) {
    roundScores[teamId] =
      cardScores[teamId] +
      declarationScores[teamId];
  }

  return {
    round: input.round,
    cardScores,
    declarationScores,
    roundScores,
    oneTwoTeamId: input.oneTwoTeamId,
    declarations: input.declarations,
  };
}