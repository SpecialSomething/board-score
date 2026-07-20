import { describe, expect, it } from "vitest";

import { calculateTichuGame } from "./game";
import type { TichuRoundResult } from "./types";

function createRoundResult(
  round: number,
  team1RoundScore: number,
  team2RoundScore: number,
): TichuRoundResult {
  return {
    round,

    cardScores: {
      1: team1RoundScore,
      2: team2RoundScore,
    },

    declarationScores: {
      1: 0,
      2: 0,
    },

    roundScores: {
      1: team1RoundScore,
      2: team2RoundScore,
    },

    oneTwoTeamId: null,
    declarations: [],
  };
}

describe("calculateTichuGame", () => {
  it("라운드가 없으면 양 팀 총점은 0점이다", () => {
    const result = calculateTichuGame([]);

    expect(result).toEqual({
      totalScores: {
        1: 0,
        2: 0,
      },
      winnerTeamId: null,
      isFinished: false,
    });
  });

  it("여러 라운드의 팀별 점수를 합산한다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 65, 35),
      createRoundResult(2, 120, -20),
      createRoundResult(3, -50, 150),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 135,
      2: 165,
    });

    expect(result.isFinished).toBe(false);
    expect(result.winnerTeamId).toBeNull();
  });

  it("어느 팀도 목표 점수에 도달하지 않으면 게임이 끝나지 않는다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 500, 400),
      createRoundResult(2, 300, 350),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 800,
      2: 750,
    });

    expect(result.isFinished).toBe(false);
    expect(result.winnerTeamId).toBeNull();
  });

  it("1팀만 목표 점수에 도달하면 1팀이 승리한다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 600, 400),
      createRoundResult(2, 450, 300),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 1050,
      2: 700,
    });

    expect(result.isFinished).toBe(true);
    expect(result.winnerTeamId).toBe(1);
  });

  it("2팀만 목표 점수에 도달하면 2팀이 승리한다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 450, 550),
      createRoundResult(2, 300, 500),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 750,
      2: 1050,
    });

    expect(result.isFinished).toBe(true);
    expect(result.winnerTeamId).toBe(2);
  });

  it("양 팀이 모두 목표 점수에 도달하면 총점이 높은 팀이 승리한다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 700, 650),
      createRoundResult(2, 400, 500),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 1100,
      2: 1150,
    });

    expect(result.isFinished).toBe(true);
    expect(result.winnerTeamId).toBe(2);
  });

  it("양 팀이 목표 점수에 도달했지만 동점이면 승자를 정하지 않는다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 600, 500),
      createRoundResult(2, 500, 600),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 1100,
      2: 1100,
    });

    expect(result.isFinished).toBe(false);
    expect(result.winnerTeamId).toBeNull();
  });

  it("목표 점수를 직접 지정할 수 있다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 300, 250),
      createRoundResult(2, 250, 200),
    ];

    const result = calculateTichuGame(rounds, 500);

    expect(result.totalScores).toEqual({
      1: 550,
      2: 450,
    });

    expect(result.isFinished).toBe(true);
    expect(result.winnerTeamId).toBe(1);
  });

  it("목표 점수를 넘은 팀이 있어도 점수가 더 낮으면 패배한다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 700, 800),
      createRoundResult(2, 350, 400),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 1050,
      2: 1200,
    });

    expect(result.isFinished).toBe(true);
    expect(result.winnerTeamId).toBe(2);
  });

  it("음수 라운드 점수도 총점에 반영한다", () => {
    const rounds: TichuRoundResult[] = [
      createRoundResult(1, 200, -100),
      createRoundResult(2, -50, 250),
    ];

    const result = calculateTichuGame(rounds);

    expect(result.totalScores).toEqual({
      1: 150,
      2: 150,
    });

    expect(result.isFinished).toBe(false);
    expect(result.winnerTeamId).toBeNull();
  });
});