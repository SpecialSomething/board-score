"use client";

import type {
  TichuGameResult,
  TichuPlayer,
  TichuTeamId,
} from "../types";

type ScoreBoardProps = {
  players: TichuPlayer[];
  gameResult: TichuGameResult;
  targetScore: number;
};

const TEAM_IDS: TichuTeamId[] = [1, 2];

function formatScore(score: number): string {
  return score.toLocaleString("ko-KR");
}

export default function ScoreBoard({
  players,
  gameResult,
  targetScore,
}: ScoreBoardProps) {
  function getTeamPlayers(
    teamId: TichuTeamId,
  ): TichuPlayer[] {
    return players
      .filter(
        (player) =>
          player.teamId === teamId,
      )
      .sort(
        (firstPlayer, secondPlayer) =>
          firstPlayer.seat -
          secondPlayer.seat,
      );
  }

  function getTeamStatus(
    teamId: TichuTeamId,
  ): string {
    const score =
      gameResult.totalScores[teamId];

    if (
      gameResult.winnerTeamId === teamId
    ) {
      return "승리";
    }

    if (score >= targetScore) {
      return "목표 점수 달성";
    }

    return `${formatScore(
      targetScore - score,
    )}점 남음`;
  }

  return (
    <section className="flex w-full flex-col gap-4 rounded-2xl bg-board-surface p-5 font-sans text-board-text shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold leading-normal">
            현재 점수
          </h2>

          <p className="mt-1 text-sm leading-normal text-board-disabled-text">
            목표 점수 {formatScore(targetScore)}점
          </p>
        </div>

        {gameResult.isFinished && (
          <span className="rounded-xl bg-board-primary-soft px-3 py-1 text-sm font-semibold text-board-primary">
            게임 종료
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEAM_IDS.map((teamId) => {
          const teamPlayers =
            getTeamPlayers(teamId);

          const isWinner =
            gameResult.winnerTeamId ===
            teamId;

          return (
            <article
              key={teamId}
              className={`rounded-2xl border-2 p-4 transition-colors ${
                isWinner
                  ? "border-board-primary bg-board-primary-soft"
                  : "border-transparent bg-board-bg"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold leading-normal">
                    {teamId}팀
                  </p>

                  <p className="mt-0.5 text-sm leading-normal text-board-disabled-text">
                    {teamPlayers
                      .map(
                        (player) =>
                          player.name,
                      )
                      .join(" · ")}
                  </p>
                </div>

                {isWinner && (
                  <span className="shrink-0 rounded-xl bg-board-primary px-3 py-1 text-sm font-semibold text-white">
                    승리
                  </span>
                )}
              </div>

              <p className="mt-5 text-right text-[28px] font-bold leading-none tracking-tight">
                {formatScore(
                  gameResult.totalScores[
                    teamId
                  ],
                )}
                <span className="ml-1 text-base font-semibold">
                  점
                </span>
              </p>

              <p
                className={`mt-2 text-right text-sm font-semibold ${
                  isWinner
                    ? "text-board-primary"
                    : "text-board-disabled-text"
                }`}
              >
                {getTeamStatus(teamId)}
              </p>
            </article>
          );
        })}
      </div>

      {!gameResult.isFinished &&
        gameResult.totalScores[1] ===
          gameResult.totalScores[2] && (
          <p className="text-center text-sm font-semibold text-board-disabled-text">
            현재 동점입니다.
          </p>
        )}
    </section>
  );
}