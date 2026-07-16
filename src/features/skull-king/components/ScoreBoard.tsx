import type { Player, SkullKingRoundResult } from "../types";

type ScoreBoardProps = {
  players: Player[];
  result: SkullKingRoundResult;
};

export default function ScoreBoard({ players, result }: ScoreBoardProps) {
  function getPlayerName(playerId: string): string {
    return (
      players.find((player) => player.id === playerId)?.name ?? playerId
    );
  }

  return (
    <section className="rounded-2xl border border-board-border bg-board-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <h2 className="text-xl font-semibold">{result.round}라운드 결과</h2>

      <div className="mt-4 flex flex-col gap-3">
        {result.players.map((playerResult) => (
          <article
            key={playerResult.playerId}
            className="rounded-xl bg-board-bg p-3"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">
                {getPlayerName(playerResult.playerId)}
              </h3>
              <strong className="text-lg">
                {playerResult.roundScore > 0 ? "+" : ""}
                {playerResult.roundScore}점
              </strong>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-board-muted">
              <div className="contents">
                <dt>예측</dt>
                <dd className="text-right">
                  {playerResult.bidSuccess ? "성공" : "실패"}
                </dd>
              </div>
              <div className="contents">
                <dt>예측 점수</dt>
                <dd className="text-right">{playerResult.bidScore}점</dd>
              </div>
              <div className="contents">
                <dt>포획 보너스</dt>
                <dd className="text-right">{playerResult.captureBonus}점</dd>
              </div>
              <div className="contents">
                <dt>약탈품 보너스</dt>
                <dd className="text-right">{playerResult.lootBonus}점</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
