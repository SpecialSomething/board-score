import {describe, expect, it} from "vitest"
import { calculateSkullKingRound } from "./calculator"
import type { 
    SkullKingBonusInput,
    SkullKingPlayerRoundInput,
    SkullKingRoundInput
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

describe("calculateSkullKingRound", () => {
    describe("비드 점수", () => {
        it("일반 비드를 맞히면 비드당 20점을 얻는다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        bid: 3,
                        tricks: 3
                    }),
                ],
                lootAlliances: [],
            };
            const result = calculateSkullKingRound(input);
            const player = result.players[0];

            expect(result.round).toBe(5);
            expect(player.bidSuccess).toBe(true);
            expect(player.bidScore).toBe(60);
            expect(player.roundScore).toBe(60);
        });

        it("일반 비드를 틀리면 차이당 10점을 감점한다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        bid: 3,
                        tricks: 1
                    }),
                ],
                lootAlliances: [],
            };
            const result = calculateSkullKingRound(input);
            const player = result.players[0];

            expect(player.bidSuccess).toBe(false);
            expect(player.bidScore).toBe(-20);
            expect(player.roundScore).toBe(-20);
        });

        it("0 비드를 맞히면 라운드당 10점을 얻는다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        bid: 0,
                        tricks: 0
                    }),
                ],
                lootAlliances: [],
            };
            const result = calculateSkullKingRound(input);
            const player = result.players[0];

            expect(player.bidSuccess).toBe(true);
            expect(player.bidScore).toBe(50);
            expect(player.roundScore).toBe(50);
        });

        it("0 비드에 실패하면 라운드당 10점을 감점한다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        bid: 0,
                        tricks: 2
                    }),
                ],
                lootAlliances: [],
            };
            const result = calculateSkullKingRound(input);
            const player = result.players[0];

            expect(player.bidSuccess).toBe(false);
            expect(player.bidScore).toBe(-50);
            expect(player.roundScore).toBe(-50);
        });
    });

    describe("포획 및 14카드 보너스", () => {
        it("비드 성공 시 모든 포획 보너스를 합산한다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        bid: 2,
                        tricks: 2,
                        bonuses: createBonuses({
                            standardFourteens: 1,               // 10
                            blackFourteens: 1,                  // 20
                            mermaidsCapturedByPirate: 1,        // 20
                            piratesCapturedBySkullKing: 1,      // 30
                            skullKingCapturedByMermaid: true,   // 40
                        }),
                    }),
                ],
                lootAlliances: [],
            };
            const result = calculateSkullKingRound(input);
            const player = result.players[0];

            expect(player.bidScore).toBe(40);
            expect(player.captureBonus).toBe(120);
            expect(player.totalBonus).toBe(120);
            expect(player.roundScore).toBe(160);
        });

        it("비드 실패 시 모든 포획 보너스를 적용하지 않는다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        bid: 2,
                        tricks: 1,
                        bonuses: createBonuses({
                            standardFourteens: 1,               
                            skullKingCapturedByMermaid: true, 
                        }),
                    }),
                ],
                lootAlliances: [],
            };
            const result = calculateSkullKingRound(input);
            const player = result.players[0];

            expect(player.bidSuccess).toBe(false);
            expect(player.bidScore).toBe(-10);
            expect(player.captureBonus).toBe(0);
            expect(player.totalBonus).toBe(0);
            expect(player.roundScore).toBe(-10);
        });
    });

    describe("약탈품 보너스", () => {
        it("동맹 양쪽이 비드를 맞히면 각각 20점을 얻는다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        playerId: "player-a",
                        bid: 1,
                        tricks: 1,
                    }),
                    createPlayer({
                        playerId: "player-b",
                        bid: 2,
                        tricks: 2,
                    }),
                ],
                lootAlliances: [
                    {
                        playerId: 'player-a',
                        partnerId: 'player-b',
                    },
                ],
            };
            const result = calculateSkullKingRound(input);
            const playerA = result.players.find(
                (player) => player.playerId === 'player-a'
            );
            const playerB = result.players.find(
                (player) => player.playerId === 'player-b'
            );

            expect(playerA?.lootBonus).toBe(20);
            expect(playerB?.lootBonus).toBe(20);
        });

        it("동맹 중 한 명이 비드에 실패하면 둘 다 보너스를 받지 못한다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        playerId: "player-a",
                        bid: 1,
                        tricks: 1,
                    }),
                    createPlayer({
                        playerId: "player-b",
                        bid: 2,
                        tricks: 3,
                    }),
                ],
                lootAlliances: [
                    {
                        playerId: 'player-a',
                        partnerId: 'player-b',
                    },
                ],
            };
            const result = calculateSkullKingRound(input);
            const playerA = result.players.find(
                (player) => player.playerId === 'player-a'
            );
            const playerB = result.players.find(
                (player) => player.playerId === 'player-b'
            );

            expect(playerA?.lootBonus).toBe(0);
            expect(playerB?.lootBonus).toBe(0);
        });

        it("같은 두 플레이어가 동맹을 두 번 맺으면 각각 40점을 얻는다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({
                        playerId: "player-a",
                        bid: 1,
                        tricks: 1,
                    }),
                    createPlayer({
                        playerId: "player-b",
                        bid: 3,
                        tricks: 3,
                    }),
                ],
                lootAlliances: [
                    {
                        playerId: 'player-a',
                        partnerId: 'player-b',
                    },
                    {
                        playerId: 'player-a',
                        partnerId: 'player-b',
                    },
                ],
            };
            const result = calculateSkullKingRound(input);
            const playerA = result.players.find(
                (player) => player.playerId === 'player-a'
            );
            const playerB = result.players.find(
                (player) => player.playerId === 'player-b'
            );

            expect(playerA?.lootBonus).toBe(40);
            expect(playerB?.lootBonus).toBe(40);
        });
    });

    describe("입력 검증", () => {
        it("라운드가 1보다 작으면 오류를 발생시킨다", () => {
            const input : SkullKingRoundInput = {
                round : 0,
                players: [],
                lootAlliances: [],
            };
            
            expect(() => calculateSkullKingRound(input)).toThrow(
                "Invalid round"
            );
        });

        it("라운드가 10보다 크면 오류를 발생시킨다", () => {
            const input : SkullKingRoundInput = {
                round : 11,
                players: [],
                lootAlliances: [],
            };
            
            expect(() => calculateSkullKingRound(input)).toThrow(
                "Invalid round"
            );
        });

        it("플레이어 아이디가 중복되면 오류를 발생시킨다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({playerId: 'same-id'}),
                    createPlayer({playerId: 'same-id'}),
                ],
                lootAlliances: [],
            };
            
            expect(() => calculateSkullKingRound(input)).toThrow(
                "Duplicate playerId"
            );
        });

        it("약탈품 동맹이 2개보다 많으면 오류를 발생시킨다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({playerId: 'player-a'}),
                    createPlayer({playerId: 'player-b'}),
                ],
                lootAlliances: [
                    {
                        playerId: 'player-a',
                        partnerId: 'player-b',
                    },
                    {
                        playerId: 'player-a',
                        partnerId: 'player-b',
                    },
                    {
                        playerId: 'player-a',
                        partnerId: 'player-b',
                    },
                ],
            };
            
            expect(() => calculateSkullKingRound(input)).toThrow(
                "Too many loot alliances"
            );
        });

        it("존재하지 않는 플레이어가 약탈품 동맹에 들어가면 오류를 발생시킨다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({playerId: 'player-a'}),
                ],
                lootAlliances: [
                    {
                        playerId: 'player-a',
                        partnerId: 'unknown-player',
                    },
                ],
            };
            
            expect(() => calculateSkullKingRound(input)).toThrow(
                "Invalid loot alliance partnerId"
            );
        });

        it("자기 자신과 약탈품 동맹을 맺으면 오류를 발생시킨다", () => {
            const input : SkullKingRoundInput = {
                round : 5,
                players: [
                    createPlayer({playerId: 'player-a'}),
                ],
                lootAlliances: [
                    {
                        playerId: 'player-a',
                        partnerId: 'player-a',
                    },
                ],
            };
            
            expect(() => calculateSkullKingRound(input)).toThrow(
                "Loot alliance cannot be self alliance"
            );
        });
    });
});