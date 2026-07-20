"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";

import { calculateTichuRound } from "@/features/tichu/calculator";
import GameSetup from "@/features/tichu/components/GameSetup";
import RoundForm from "@/features/tichu/components/RoundForm";
import RoundHistory from "@/features/tichu/components/RoundHistory";
import ScoreBoard from "@/features/tichu/components/ScoreBoard";
import { calculateTichuGame } from "@/features/tichu/game";

import type {
  TichuPlayer,
  TichuRoundInput,
  TichuRoundResult,
} from "@/features/tichu/types";

import { 
    clearTichuGame,
    loadTichuGame,
    saveTichuGame,
} from "@/features/tichu/storage";

type TichuSetup = {
  players: TichuPlayer[];
  targetScore: number;
};

export default function TichuPage() {
  const router = useRouter();

  const [isStorageLoaded, setIsStorageLoaded] =
    useState(false);

  const [setup, setSetup] =
    useState<TichuSetup | null>(null);

  const [roundResults, setRoundResults] =
    useState<TichuRoundResult[]>([]);

  const currentRound =
    roundResults.length + 1;

  const gameResult = useMemo(() => {
    if (!setup) {
      return null;
    }

    return calculateTichuGame(
      roundResults,
      setup.targetScore,
    );
  }, [roundResults, setup]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedGame = loadTichuGame();
  
    if (
      savedGame?.isGameStarted &&
      !savedGame.isGameFinished
    ) {
      setSetup({
        players: savedGame.players,
        targetScore: savedGame.targetScore,
      });
  
      setRoundResults(
        savedGame.roundResults,
      );
    }
  
    setIsStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (
      !isStorageLoaded ||
      !setup ||
      !gameResult
    ) {
      return;
    }
  
    saveTichuGame({
      players: setup.players,
      targetScore: setup.targetScore,
      roundResults,
      isGameStarted: true,
      isGameFinished:
        gameResult.isFinished,
      updatedAt: Date.now(),
    });
  }, [
    gameResult,
    isStorageLoaded,
    roundResults,
    setup,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleStartGame(
    players: TichuPlayer[],
    targetScore: number,
  ) {
    clearTichuGame();

    setSetup({
      players,
      targetScore,
    });

    setRoundResults([]);
    router.replace("/games/tichu");
  }

  function handleSubmit(
    input: TichuRoundInput,
  ) {
    if (gameResult?.isFinished) {
      return;
    }

    const result =
      calculateTichuRound(input);

    setRoundResults((previousResults) => [
      ...previousResults,
      result,
    ]);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  function handlePlayAgain() {
    setRoundResults([]);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  function handleNewGame() {
    clearTichuGame();

    setSetup(null);
    setRoundResults([]);

    router.replace(
      "/games/tichu?new=1",
    );

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  function handleGoHome() {
    router.push("/");
  }

  if (!isStorageLoaded) {
    return (
      <div className="min-h-screen bg-board-bg">
        <main className="mx-auto w-full max-w-[393px] p-6 font-sans text-board-text">
          <Header />
  
          <p className="mt-6">
            게임을 불러오는 중입니다...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-board-bg">
      <main className="mx-auto flex w-full max-w-[393px] flex-col gap-6 p-6 font-sans text-board-text">
        <Header />

        {!setup || !gameResult ? (
          <GameSetup
            onStart={handleStartGame}
          />
        ) : (
          <>
            {gameResult.isFinished ? (
              <>
                <section className="flex flex-col gap-4">
                  <header>
                    <h1 className="text-[32px] font-bold leading-[39px] tracking-[-0.02em]">
                      게임 종료
                    </h1>

                    <p className="mt-1 text-xl font-semibold">
                      축하합니다!
                    </p>
                  </header>

                  <div className="rounded-2xl border border-board-border bg-board-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                    <p className="text-center text-lg font-semibold">
                      {gameResult.winnerTeamId}팀이
                      승리했습니다.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-board-primary-soft p-4 text-center">
                        <p className="text-sm font-semibold text-board-muted">
                          1팀
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {gameResult.totalScores[1]}점
                        </p>
                      </div>

                      <div className="rounded-xl bg-board-secondary p-4 text-center">
                        <p className="text-sm font-semibold text-board-muted">
                          2팀
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {gameResult.totalScores[2]}점
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlayAgain}
                    className="h-11 w-full rounded-xl bg-board-primary font-semibold text-white transition-colors hover:bg-board-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary"
                  >
                    한 판 더?
                  </button>

                  <button
                    type="button"
                    onClick={handleNewGame}
                    className="h-11 w-full rounded-xl bg-board-secondary font-semibold text-board-text transition-colors hover:bg-board-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary"
                  >
                    새 게임
                  </button>

                  <button
                    type="button"
                    onClick={handleGoHome}
                    className="h-11 w-full rounded-xl bg-board-secondary font-semibold text-board-text transition-colors hover:bg-board-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary"
                  >
                    홈으로
                  </button>
                </section>

                {roundResults.length > 0 && (
                  <RoundHistory
                    players={setup.players}
                    roundResults={roundResults}
                  />
                )}
              </>
            ) : (
              <>
                <ScoreBoard
                  players={setup.players}
                  gameResult={gameResult}
                  targetScore={setup.targetScore}
                />

                <RoundForm
                  key={currentRound}
                  players={setup.players}
                  round={currentRound}
                  onSubmit={handleSubmit}
                />

                {roundResults.length > 0 && (
                  <RoundHistory
                    players={setup.players}
                    roundResults={roundResults}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}