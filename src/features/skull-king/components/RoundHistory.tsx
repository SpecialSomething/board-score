import type {
  Player,
  SkullKingRoundResult,
} from "../types";

type RoundHistoryProps = {
  players: Player[];
  results: SkullKingRoundResult[];
};

export default function RoundHistory({
  players,
  results,
}: RoundHistoryProps) {

  function getRoundScore(
    result: SkullKingRoundResult,
    playerId: string
  ): number {
    return (
      result.players.find(
        (playerResult) => playerResult.playerId === playerId
      )?.roundScore ?? 0
    );
  }
  function formatScore(score: number): string {
    return score > 0 ? `+${score}` : `${score}`;
  }

  function getTotalScore(playerId: string): number {
    return results.reduce((sum, result) => {
        const playerResult = result.players.find(
            (player) => player.playerId === playerId
        );

        return sum + (playerResult?.roundScore ?? 0);
    }, 0);
  }
 
  return (
    <section>
      <h2>라운드별 점수</h2>

      <table>
        <thead>
          <tr>
            <th>라운드</th>

            {players.map((player) => (
              <th key={player.id}>{player.name}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {results.map((result) => (
            <tr key={result.round}>
              <th>{result.round}</th>

              {players.map((player) => (
                <td key={player.id}>
                  {formatScore(getRoundScore(result, player.id))}점
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        <tfoot>
            <tr>
                <th>Total</th>
        
                {players.map((player) => (
                    <td key={player.id}>
                        {formatScore(getTotalScore(player.id))}점
                    </td>
                ))}
            </tr>
        </tfoot>

      </table>
    </section>
  );
}