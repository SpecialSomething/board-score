"use client";

import type {
  TichuPlayer,
  TichuRoundResult,
  TichuTeamId,
} from "../types";

type RoundHistoryProps = {
  players: TichuPlayer[];
  roundResults: TichuRoundResult[];
};

const TEAM_IDS: TichuTeamId[] = [1, 2];

function formatScore(score: number): string {
  return score > 0
    ? `+${score}`
    : `${score}`;
}

export default function RoundHistory({
  players,
  roundResults,
}: RoundHistoryProps) {
  function getPlayerName(
    playerId: string,
  ): string {
    return (
      players.find(
        (player) =>
          player.id === playerId,
      )?.name ?? "알 수 없는 플레이어"
    );
  }

  if (roundResults.length === 0) {
    return (
      <section className="flex w-full flex-col gap-4 rounded-2xl bg-board-surface p-5 font-sans text-board-text shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
        <header>
          <h2 className="text-xl font-semibold leading-normal">
            라운드 기록
          </h2>

          <p className="mt-1 text-sm leading-normal text-board-disabled-text">
            아직 저장된 라운드가 없습니다.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-4 rounded-2xl bg-board-surface p-5 font-sans text-board-text shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
      <header>
        <h2 className="text-xl font-semibold leading-normal">
          라운드 기록
        </h2>

        <p className="mt-1 text-sm leading-normal text-board-disabled-text">
          최근 라운드가 위에 표시됩니다.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {[...roundResults]
          .reverse()
          .map((result) => (
            <article
              key={result.round}
              className="rounded-2xl bg-board-bg p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold leading-normal">
                  {result.round}라운드
                </h3>

                {result.oneTwoTeamId !==
                  null && (
                  <span className="rounded-xl bg-board-primary-soft px-3 py-1 text-sm font-semibold text-board-primary">
                    {result.oneTwoTeamId}팀
                    원투
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-3 text-sm">
                <span className="font-semibold text-board-disabled-text">
                  구분
                </span>

                {TEAM_IDS.map(
                  (teamId) => (
                    <span
                      key={teamId}
                      className="text-right font-semibold text-board-disabled-text"
                    >
                      {teamId}팀
                    </span>
                  ),
                )}

                <span className="font-medium">
                  카드 점수
                </span>

                {TEAM_IDS.map(
                  (teamId) => (
                    <span
                      key={teamId}
                      className="text-right font-semibold"
                    >
                      {formatScore(
                        result.cardScores[
                          teamId
                        ],
                      )}
                    </span>
                  ),
                )}

                <span className="font-medium">
                  티츄 선언
                </span>

                {TEAM_IDS.map(
                  (teamId) => (
                    <span
                      key={teamId}
                      className="text-right font-semibold"
                    >
                      {formatScore(
                        result
                          .declarationScores[
                          teamId
                        ],
                      )}
                    </span>
                  ),
                )}

                <span className="border-t border-board-secondary pt-3 font-semibold">
                  라운드 합계
                </span>

                {TEAM_IDS.map(
                  (teamId) => (
                    <span
                      key={teamId}
                      className="border-t border-board-secondary pt-3 text-right text-base font-bold"
                    >
                      {formatScore(
                        result.roundScores[
                          teamId
                        ],
                      )}
                    </span>
                  ),
                )}
              </div>

              {result.declarations.length >
                0 && (
                <div className="mt-4 border-t border-board-secondary pt-4">
                  <p className="text-sm font-semibold">
                    선언 내역
                  </p>

                  <div className="mt-2 flex flex-col gap-2">
                    {result.declarations.map(
                      (declaration) => (
                        <div
                          key={
                            declaration.playerId
                          }
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span>
                            {getPlayerName(
                              declaration.playerId,
                            )}{" "}
                            ·{" "}
                            {declaration.type ===
                            "small-tichu"
                              ? "스몰 티츄"
                              : "그랜드 티츄"}
                          </span>

                          <span
                            className={`shrink-0 font-semibold ${
                              declaration.success
                                ? "text-board-primary"
                                : "text-board-danger"
                            }`}
                          >
                            {declaration.success
                              ? "성공"
                              : "실패"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
      </div>
    </section>
  );
}