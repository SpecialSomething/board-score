import type {
  RoundPlayer,
  SkullKingRoundResult,
} from "./types";

export type SkullKingStanding = {
  playerId: string;
  playerName: string;
  totalScore: number;
  rank: number;
};

export function calculateStandings(
  players: RoundPlayer[],
  roundResults: SkullKingRoundResult[]
): SkullKingStanding[] {
  const totalScores = new Map<string, number>();

  for (const roundResult of roundResults) {
    for (const playerResult of roundResult.players) {
      const currentScore =
        totalScores.get(playerResult.playerId) ?? 0;

      totalScores.set(
        playerResult.playerId,
        currentScore + playerResult.roundScore
      );
    }
  }

  const sortedStandings = players
    .map((roundPlayer) => ({
      playerId: roundPlayer.player.id,
      playerName: roundPlayer.player.name,
      totalScore:
        totalScores.get(roundPlayer.player.id) ?? 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return sortedStandings.map((player) => {
    const firstSameScoreIndex =
      sortedStandings.findIndex(
        (standing) =>
          standing.totalScore === player.totalScore
      );

    return {
      ...player,
      rank: firstSameScoreIndex + 1,
    };
  });
}