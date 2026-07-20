"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import type {
  LootAlliance,
  Player,
  SkullKingRoundInput,
  SkullKingRoundResult,
} from "@/features/skull-king/types";

import {
  clearSkullKingGame,
  loadSkullKingGame,
  saveSkullKingGame,
} from "@/features/skull-king/storage";

import { calculateSkullKingRound } from "@/features/skull-king/calculator";

import RoundForm from "@/features/skull-king/components/RoundForm";

import type { RoundPlayer } from "@/features/skull-king/types";

import { MAX_ROUND } from "@/features/skull-king/constants";

import GameSetup from "@/features/skull-king/components/GameSetup";

import RoundHistory from "@/features/skull-king/components/RoundHistory";

import Header from "@/components/Header";

import { calculateStandings } from "@/features/skull-king/standings";

import {
  createRoundPlayers,
  resetRoundPlayerInputs,
} from "@/features/skull-king/factories";


export default function SkullKingPage() {
  const router = useRouter();

  const [players, setPlayers] = useState<RoundPlayer[]>([]);

  const [isGameFinished, setIsGameFinished] = useState(false);

  const [currentRound, setCurrentRound] = useState(1);

  const [roundResults, setRoundResults] = useState<SkullKingRoundResult[]>([]);

  const [lootAlliances, setLootAlliances] = useState<LootAlliance[]>([]);

  const [isGameStarted, setIsGameStarted] = useState(false);

  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const standings = calculateStandings(players, roundResults);

  const totalScores = new Map(
    standings.map((standing) => [
      standing.playerId,
      standing.totalScore
    ])
  );


  useEffect(() => {
    const searchParams = new URLSearchParams(
      window.location.search
    );

    const shouldStartNewGame =
      searchParams.get("new") === "1";

    if (shouldStartNewGame) {
      // 기존 저장 게임을 불러오지 않고 설정 화면을 표시한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsStorageLoaded(true);
      return;
    }

    const savedGame = loadSkullKingGame();

    if (savedGame) {
      // localStorage의 진행 중 게임을 최초 한 번 복원합니다.
      setPlayers(savedGame.players);

      setCurrentRound(savedGame.currentRound);
      setRoundResults(savedGame.roundResults);
      setLootAlliances(savedGame.lootAlliances);
      setIsGameStarted(savedGame.isGameStarted);
      setIsGameFinished(savedGame.isGameFinished);
    }

    setIsStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!isStorageLoaded || !isGameStarted) {
      return;
    }
    saveSkullKingGame({
      players,
      currentRound,
      roundResults,
      lootAlliances,
      isGameStarted,
      isGameFinished,
      updatedAt: Date.now(),
    });
  }, [
    players,
    currentRound,
    roundResults,
    lootAlliances,
    isGameStarted,
    isGameFinished,
    isStorageLoaded,
  ]);


  

  function handleStartGame(newPlayers: Player[]) {
    const roundPlayers = createRoundPlayers(newPlayers);

    setPlayers(roundPlayers);
    setCurrentRound(1);
    setRoundResults([]);
    setLootAlliances([]);
    setIsGameFinished(false);
    setIsGameStarted(true);
    router.replace("/games/skull-king");
  }

  function handlePlayAgain() {
    clearSkullKingGame();

    setPlayers((currentPlayers) =>
      resetRoundPlayerInputs(currentPlayers)
    );
    setCurrentRound(1);
    setRoundResults([]);
    setLootAlliances([]);
    setIsGameFinished(false);
    setIsGameStarted(true);
  }

  function handleGoHome() {
    clearSkullKingGame();
    router.push("/")
  }

  function handleSubmit() {
    if (isGameFinished) {
        return;
    }

    const input: SkullKingRoundInput = {
        round: currentRound,
        players: players.map((roundPlayer) => roundPlayer.value),
        lootAlliances,
    };



    const result = calculateSkullKingRound(input);

    setRoundResults((previousResults) => [
        ...previousResults,
        result,
    ]);

    setLootAlliances([]);

    if (currentRound === MAX_ROUND) {
        setIsGameFinished(true);
    }
    else {
        setPlayers((currentPlayer) => resetRoundPlayerInputs(currentPlayer));
        setCurrentRound((round) => round + 1);
    }

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  return (
    <div className="min-h-screen bg-board-bg">
      <main className="mx-auto flex w-full max-w-[393px] flex-col gap-6 p-6 font-sans text-board-text">
        <Header />
  
        {!isGameStarted ? (
          <GameSetup
            onStart={handleStartGame}
          />
        ) : (
          <>
            {isGameFinished ? (
              <>
                <h1 className="text-[32px] font-bold tracking-[-0.02em]">
                  게임 종료
                </h1>
  
                <h2 className="text-xl font-bold">
                  축하합니다!
                </h2>
  
                <ol className="flex flex-col text-xl">
                  {standings.map((player) => (
                    <li
                      key={player.playerId}
                      className={
                        player.rank === 1
                          ? "font-bold"
                          : player.rank < 4
                            ? "font-semibold"
                            : "font-normal text-board-muted"
                      }
                    >
                      {player.rank}. {player.playerName}{" "}
                      {player.totalScore}점
                    </li>
                  ))}
                </ol>
  
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="h-[35px] rounded-xl bg-board-primary text-white"
                >
                  한 판 더?
                </button>
  
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="h-[35px] rounded-xl bg-board-primary text-white"
                >
                  홈으로
                </button>
  
                <RoundHistory
                  players={players.map(
                    (roundPlayer) => roundPlayer.player
                  )}
                  results={roundResults}
                />
              </>
            ) : (
              <>
                <RoundForm
                  round={currentRound}
                  players={players}
                  totalScores={totalScores}
                  lootAlliances={lootAlliances}
                  onPlayersChange={setPlayers}
                  onLootAlliancesChange={setLootAlliances}
                  onSubmit={handleSubmit}
                />
  
                {roundResults.length > 0 && (
                  <>
                    <section className="rounded-2xl border border-board-border bg-board-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                      <h2 className="text-xl font-semibold">
                        현재 순위
                      </h2>
  
                      <ol className="mt-4 flex flex-col gap-2">
                        {standings.map((player, index) => (
                          <li
                            key={player.playerId}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                              index === 0
                                ? "bg-board-primary-soft"
                                : "bg-board-secondary"
                            }`}
                          >
                            <span className="font-semibold">
                              {player.rank}. {player.playerName}
                            </span>
  
                            <strong>
                              {player.totalScore}점
                            </strong>
                          </li>
                        ))}
                      </ol>
                    </section>
  
                    <RoundHistory
                      players={players.map(
                        (roundPlayer) =>
                          roundPlayer.player
                      )}
                      results={roundResults}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  ); 
}
