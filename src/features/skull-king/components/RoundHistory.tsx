import type { Player, SkullKingRoundResult } from "../types";

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
    return results.reduce(
      (sum, result) => sum + getRoundScore(result, playerId),
      0
    );
  }

  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <h2 className="text-xl font-semibold">라운드 기록</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="whitespace-nowrap border-b border-[#e5e7eb] p-2 text-left">
                라운드
              </th>
              {players.map((player) => (
                <th
                  key={player.id}
                  className="whitespace-nowrap border-b border-[#e5e7eb] p-2 text-right"
                >
                  {player.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {results.map((result) => (
              <tr key={result.round}>
                <th className="whitespace-nowrap border-b border-[#eeeeee] p-2 text-left font-medium">
                  {result.round}
                </th>
                {players.map((player) => (
                  <td
                    key={player.id}
                    className="whitespace-nowrap border-b border-[#eeeeee] p-2 text-right"
                  >
                    {formatScore(getRoundScore(result, player.id))}점
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th className="whitespace-nowrap p-2 text-left font-semibold">
                Total
              </th>
              {players.map((player) => (
                <td
                  key={player.id}
                  className="whitespace-nowrap p-2 text-right font-semibold"
                >
                  {formatScore(getTotalScore(player.id))}점
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
