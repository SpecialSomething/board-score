import type {
  Player,
  SkullKingRoundResult,
} from "../types";

import type {
  SkullKingStanding,
} from "../standings";

import RoundHistory from "./RoundHistory";
import StandingsSection from "./StandingSection";

type GameResultScreenProps = {
  players: Player[];
  standings: SkullKingStanding[];
  roundResults: SkullKingRoundResult[];

  onPlayAgain: () => void;
  onGoHome: () => void;

  currentPlayerId?: string;
  isPlayAgainLoading?: boolean;
  canPlayAgain?: boolean;
};

export default function GameResultScreen({
  players,
  standings,
  roundResults,
  onPlayAgain,
  onGoHome,
  currentPlayerId,
  isPlayAgainLoading = false,
  canPlayAgain = true,
}: GameResultScreenProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
      <header className="text-center">
        <p className="text-sm font-semibold text-board-primary">
          게임 종료
        </p>

        <h1 className="mt-1 text-2xl font-bold text-board-text">
          축하합니다!
        </h1>
      </header>

      <StandingsSection
        standings={standings}
        currentPlayerId={currentPlayerId}
        title="최종 순위"
      />

      <div className="mt-5 mb-6">
        {canPlayAgain ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              disabled={isPlayAgainLoading}
              className="rounded-xl bg-board-primary px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPlayAgainLoading
                ? "준비 중..."
                : "한 판 더?"}
            </button>
      
            <button
              type="button"
              onClick={onGoHome}
              disabled={isPlayAgainLoading}
              className="rounded-xl border border-board-primary bg-white px-4 py-3 font-semibold text-board-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              홈으로
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm text-board-muted">
              방장이 한 판 더 시작하면
              <br />
              같은 인원으로 대기방에 이동합니다.
            </p>
      
            <button
              type="button"
              onClick={onGoHome}
              className="w-full rounded-xl border border-board-primary bg-white px-4 py-3 font-semibold text-board-primary"
            >
              홈으로
            </button>
          </div>
        )}
      </div>

      <RoundHistory
        players={players}
        results={roundResults}
      />
    </main>
  );
}