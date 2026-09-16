import type {
  SkullKingStanding,
} from "../standings";

type StandingsSectionProps = {
  standings: SkullKingStanding[];
  currentPlayerId?: string;
  title?: string;
};

export default function StandingsSection({
  standings,
  currentPlayerId,
  title = "현재 순위",
}: StandingsSectionProps) {
  if (standings.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 rounded-2xl border border-board-border bg-board-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <h2 className="text-xl font-semibold text-board-text">
        {title}
      </h2>

      <ol className="mt-4 flex flex-col gap-2">
        {standings.map((standing, index) => {
          const isMe =
            standing.playerId ===
            currentPlayerId;

          return (
            <li
              key={standing.playerId}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                index === 0
                  ? "bg-board-primary-soft"
                  : "bg-board-secondary"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-8 shrink-0 text-sm font-bold text-board-primary">
                  {standing.rank}위
                </span>

                <span className="truncate font-semibold text-board-text">
                  {standing.playerName}

                  {isMe && (
                    <span className="ml-1 text-xs font-normal text-board-text-muted">
                      (나)
                    </span>
                  )}
                </span>
              </div>

              <strong
                className={`shrink-0 font-bold ${
                  standing.totalScore > 0
                    ? "text-board-primary"
                    : standing.totalScore < 0
                      ? "text-red-600"
                      : "text-board-text-muted"
                }`}
              >
                {formatScore(
                  standing.totalScore,
                )}
              </strong>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function formatScore(score: number) {
  return score > 0
    ? `+${score}점`
    : `${score}점`;
}