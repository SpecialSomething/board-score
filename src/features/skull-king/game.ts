import { calculateSkullKingRound } from "./calculator";
import type { 
    PlayerId,
    SkullKingGameInput,
    SkullKingGamePlayerResult, 
    SkullKingGameResult 
} from "./types";

export function calculateSkullKingGame(
    input: SkullKingGameInput
): SkullKingGameResult {
    // 플레이어별 결과를 저장할 Map. 마지막에 value들을 return할 것임.
    const playerResults = new Map<PlayerId, SkullKingGamePlayerResult>();

    // input.rounds에 있는 SkullKingRoundInput을 순회함
    for (const roundInput of input.rounds) {
        // 스컬킹 라운드 계산기인 calculateSkullKingRound로 각 라운드를 계산함
        const roundResult = calculateSkullKingRound(roundInput);

        // 각 라운드의 모든 플레이어를 순회함
        for (const playerRoundResult of roundResult.players) {
            // 플레이어의 정보가 처음 생성한 Map에 있는지 확인
            const existingResult = playerResults.get(
                playerRoundResult.playerId
            );

            // 있을 경우
            if (existingResult) {
                // 플레이어의 정보를 삽입함
                existingResult.roundResults.push(playerRoundResult);
                // 최종 스코어를 업데이트함
                existingResult.totalScore += playerRoundResult.roundScore;
            }
            // 없을 경우
            else {
                // 플레이어의 정보를 업데이트함
                playerResults.set(playerRoundResult.playerId, {
                    playerId: playerRoundResult.playerId,
                    roundResults: [playerRoundResult],
                    totalScore: playerRoundResult.roundScore
                });
            }
        }
    }

    return {
        players: Array.from(playerResults.values())
    };
}