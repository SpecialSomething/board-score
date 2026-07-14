import {describe, expect, it} from "vitest"
import { calculateSkullKingGame } from "./game"

import type {
  SkullKingBonusInput,
  SkullKingGameInput,
  SkullKingPlayerRoundInput,
  SkullKingRoundInput,
} from "./types"

function createBonuses(
    overrides: Partial<SkullKingBonusInput> = {}
): SkullKingBonusInput {
    return {
        standardFourteens: 0,
        blackFourteens: 0,
        mermaidsCapturedByPirate: 0,
        piratesCapturedBySkullKing: 0,
        skullKingCapturedByMermaid: false,
        ...overrides,
    };
}

function createPlayer(
    overrides: Partial<SkullKingPlayerRoundInput> = {}
): SkullKingPlayerRoundInput {
    return {
        playerId: "player-a",
        bid: 0,
        tricks: 0,
        bonuses: createBonuses(),
        ...overrides,
    };
}

function createRound(
    round: number,
    players: SkullKingPlayerRoundInput[]
): SkullKingRoundInput {
    return {
        round,
        players,
        lootAlliances: [],
    };
}

describe("calculateSkullKingGame", () => {
    it("한 플레이어의 여러 라운드 점수를 누적한다", () => {
        const input: SkullKingGameInput = {
            rounds: [
                createRound(1, [
                    createPlayer({
                        playerId: "player-a",
                        bid: 1,
                        tricks: 1,
                    }),
                ]),
                createRound(2, [
                    createPlayer({
                        playerId: "player-a",
                        bid: 0,
                        tricks: 0,
                    }),
                ]),
            ],
        };

        const result = calculateSkullKingGame(input);
        const player = result.players[0];

        expect(player.playerId).toBe("player-a");
        expect(player.roundResults).toHaveLength(2);

        // 1라운드 : 1비드 성공 = 20점
        // 2라운드 : 0비드 성공 = 20점
        expect(player.totalScore).toBe(40);
    });

    it("여러 플레이어의 점수를 각각 따로 누적한다", () => {
        const input: SkullKingGameInput = {
            rounds: [
                createRound(1, [
                    createPlayer({
                        playerId: "player-a",
                        bid: 1,
                        tricks: 1,
                    }),
                    createPlayer({
                        playerId: "player-b",
                        bid: 0,
                        tricks: 0,
                    }),
                ]),
                createRound(2, [
                    createPlayer({
                        playerId: "player-a",
                        bid: 0,
                        tricks: 0,
                    }),
                    createPlayer({
                        playerId: "player-b",
                        bid: 1,
                        tricks: 0,
                    }),
                ]),
            ],
        };

        const result = calculateSkullKingGame(input);

        const playerA = result.players.find(
            (player) => player.playerId === "player-a"
        );

        const playerB = result.players.find(
            (player) => player.playerId === "player-b"
        );

        // 1라운드 : 1비드 성공 = 20점
        // 2라운드 : 0비드 성공 = 20점
        expect(playerA?.totalScore).toBe(40);

        // 1라운드 : 0비드 성공 = 10점
        // 2라운드 : 1비드 실패 = -10점
        expect(playerB?.totalScore).toBe(0);
    });

    it("라운드를 입력 순서대로 저장한다", () => {
        const input: SkullKingGameInput = {
            rounds: [
                createRound(1, [
                    createPlayer({
                        playerId: "player-a",
                        bid: 1,
                        tricks: 1,
                    }),
                ]),
                createRound(2, [
                    createPlayer({
                        playerId: "player-a",
                        bid: 0,
                        tricks: 0,
                    }),
                ]),
                createRound(3, [
                    createPlayer({
                        playerId: "player-a",
                        bid: 2,
                        tricks: 2,
                    }),
                ]),
            ],
        };

        const result = calculateSkullKingGame(input);
        const player = result.players[0];

        expect(player.roundResults.map((result) => result.round)).toEqual([
            1,
            2,
            3,
        ]);

        expect(player.roundResults.map((result) => result.roundScore)).toEqual([
            20,
            20,
            40,
        ]);
    });

    it("라운드가 없으면 빈 플레이어 배열을 반환한다", () => {
        const input: SkullKingGameInput = {
            rounds: [],
        };

        const result = calculateSkullKingGame(input);

        expect(result).toEqual({
            players: [],
        });
    });
});