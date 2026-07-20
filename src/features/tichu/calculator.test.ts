import { describe, expect, it } from "vitest";

import { calculateTichuRound } from "./calculator";
import type { TichuRoundInput } from "./types";

describe("calculateTichuRound", () => {
  it("선언과 원투가 없으면 카드 점수를 그대로 라운드 점수로 계산한다", () => {
    const input: TichuRoundInput = {
      round: 1,
      cardScores: {
        1: 65,
        2: 35,
      },
      oneTwoTeamId: null,
      declarations: [],
    };

    const result = calculateTichuRound(input);

    expect(result).toEqual({
      round: 1,
      cardScores: {
        1: 65,
        2: 35,
      },
      declarationScores: {
        1: 0,
        2: 0,
      },
      roundScores: {
        1: 65,
        2: 35,
      },
      oneTwoTeamId: null,
      declarations: [],
    });
  });

  it("스몰 티츄에 성공하면 해당 팀에 100점을 더한다", () => {
    const input: TichuRoundInput = {
      round: 2,
      cardScores: {
        1: 60,
        2: 40,
      },
      oneTwoTeamId: null,
      declarations: [
        {
          playerId: "player-1",
          teamId: 1,
          type: "small-tichu",
          success: true,
        },
      ],
    };

    const result = calculateTichuRound(input);

    expect(result.declarationScores).toEqual({
      1: 100,
      2: 0,
    });

    expect(result.roundScores).toEqual({
      1: 160,
      2: 40,
    });
  });

  it("스몰 티츄에 실패하면 해당 팀에서 100점을 뺀다", () => {
    const input: TichuRoundInput = {
      round: 3,
      cardScores: {
        1: 55,
        2: 45,
      },
      oneTwoTeamId: null,
      declarations: [
        {
          playerId: "player-2",
          teamId: 2,
          type: "small-tichu",
          success: false,
        },
      ],
    };

    const result = calculateTichuRound(input);

    expect(result.declarationScores).toEqual({
      1: 0,
      2: -100,
    });

    expect(result.roundScores).toEqual({
      1: 55,
      2: -55,
    });
  });

  it("그랜드 티츄에 성공하면 해당 팀에 200점을 더한다", () => {
    const input: TichuRoundInput = {
      round: 4,
      cardScores: {
        1: 45,
        2: 55,
      },
      oneTwoTeamId: null,
      declarations: [
        {
          playerId: "player-3",
          teamId: 1,
          type: "grand-tichu",
          success: true,
        },
      ],
    };

    const result = calculateTichuRound(input);

    expect(result.declarationScores).toEqual({
      1: 200,
      2: 0,
    });

    expect(result.roundScores).toEqual({
      1: 245,
      2: 55,
    });
  });

  it("그랜드 티츄에 실패하면 해당 팀에서 200점을 뺀다", () => {
    const input: TichuRoundInput = {
      round: 5,
      cardScores: {
        1: 30,
        2: 70,
      },
      oneTwoTeamId: null,
      declarations: [
        {
          playerId: "player-4",
          teamId: 2,
          type: "grand-tichu",
          success: false,
        },
      ],
    };

    const result = calculateTichuRound(input);

    expect(result.declarationScores).toEqual({
      1: 0,
      2: -200,
    });

    expect(result.roundScores).toEqual({
      1: 30,
      2: -130,
    });
  });

  it("같은 팀의 여러 선언 점수를 합산한다", () => {
    const input: TichuRoundInput = {
      round: 6,
      cardScores: {
        1: 50,
        2: 50,
      },
      oneTwoTeamId: null,
      declarations: [
        {
          playerId: "player-1",
          teamId: 1,
          type: "small-tichu",
          success: true,
        },
        {
          playerId: "player-3",
          teamId: 1,
          type: "grand-tichu",
          success: false,
        },
      ],
    };

    const result = calculateTichuRound(input);

    expect(result.declarationScores).toEqual({
      1: -100,
      2: 0,
    });

    expect(result.roundScores).toEqual({
      1: -50,
      2: 50,
    });
  });

  it("양 팀의 선언 점수를 각각 계산한다", () => {
    const input: TichuRoundInput = {
      round: 7,
      cardScores: {
        1: 75,
        2: 25,
      },
      oneTwoTeamId: null,
      declarations: [
        {
          playerId: "player-1",
          teamId: 1,
          type: "small-tichu",
          success: true,
        },
        {
          playerId: "player-2",
          teamId: 2,
          type: "grand-tichu",
          success: true,
        },
      ],
    };

    const result = calculateTichuRound(input);

    expect(result.declarationScores).toEqual({
      1: 100,
      2: 200,
    });

    expect(result.roundScores).toEqual({
      1: 175,
      2: 225,
    });
  });

  it("1팀이 원투를 하면 카드 점수를 200대 0으로 계산한다", () => {
    const input: TichuRoundInput = {
      round: 8,
      cardScores: {
        1: 40,
        2: 60,
      },
      oneTwoTeamId: 1,
      declarations: [],
    };

    const result = calculateTichuRound(input);

    expect(result.cardScores).toEqual({
      1: 200,
      2: 0,
    });

    expect(result.roundScores).toEqual({
      1: 200,
      2: 0,
    });
  });

  it("2팀이 원투를 하면 카드 점수를 0대 200으로 계산한다", () => {
    const input: TichuRoundInput = {
      round: 9,
      cardScores: {
        1: 70,
        2: 30,
      },
      oneTwoTeamId: 2,
      declarations: [],
    };

    const result = calculateTichuRound(input);

    expect(result.cardScores).toEqual({
      1: 0,
      2: 200,
    });

    expect(result.roundScores).toEqual({
      1: 0,
      2: 200,
    });
  });

  it("원투 점수와 선언 점수를 함께 계산한다", () => {
    const input: TichuRoundInput = {
      round: 10,
      cardScores: {
        1: 0,
        2: 0,
      },
      oneTwoTeamId: 1,
      declarations: [
        {
          playerId: "player-1",
          teamId: 1,
          type: "small-tichu",
          success: true,
        },
        {
          playerId: "player-2",
          teamId: 2,
          type: "grand-tichu",
          success: false,
        },
      ],
    };

    const result = calculateTichuRound(input);

    expect(result.cardScores).toEqual({
      1: 200,
      2: 0,
    });

    expect(result.declarationScores).toEqual({
      1: 100,
      2: -200,
    });

    expect(result.roundScores).toEqual({
      1: 300,
      2: -200,
    });
  });

  it("음수 카드 점수와 100점을 초과한 카드 점수도 계산한다", () => {
    const input: TichuRoundInput = {
      round: 11,
      cardScores: {
        1: -25,
        2: 125,
      },
      oneTwoTeamId: null,
      declarations: [],
    };

    const result = calculateTichuRound(input);

    expect(result.roundScores).toEqual({
      1: -25,
      2: 125,
    });
  });

  it("입력받은 라운드와 선언 정보를 결과에 유지한다", () => {
    const declarations: TichuRoundInput["declarations"] = [
      {
        playerId: "player-3",
        teamId: 1,
        type: "small-tichu",
        success: false,
      },
    ];

    const input: TichuRoundInput = {
      round: 12,
      cardScores: {
        1: 80,
        2: 20,
      },
      oneTwoTeamId: null,
      declarations,
    };

    const result = calculateTichuRound(input);

    expect(result.round).toBe(12);
    expect(result.oneTwoTeamId).toBeNull();
    expect(result.declarations).toEqual(declarations);
  });
});