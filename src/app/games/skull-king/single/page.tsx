"use client";

import { calculateSkullKingRound } from "@/features/skull-king/calculator";
import GameSetup from "@/features/skull-king/components/GameSetup";
import RoundForm from "@/features/skull-king/components/RoundForm";
import RoundHistory from "@/features/skull-king/components/RoundHistory";
import { MAX_ROUND } from "@/features/skull-king/constants";
import { createRoundPlayers, resetRoundPlayerInputs } from "@/features/skull-king/factories";
import { calculateStandings } from "@/features/skull-king/standings";
import { loadSkullKingGame, saveSkullKingGame, clearSkullKingGame } from "@/features/skull-king/storage";
import type { RoundPlayer, SkullKingRoundResult, LootAlliance, Player, SkullKingRoundInput } from "@/features/skull-king/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import StandingsSection from "@/features/skull-king/components/StandingSection";
import GameResultScreen from "@/features/skull-king/components/GameResultScreen";
import { 
  saveRecentGame,
  clearRecentGame,
} from "@/features/recent-game/storage";


function SkullKingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shouldStartNewGame = searchParams.get("new") === "1";

  const [players, setPlayers] = useState<RoundPlayer[]>([]);

  const [isGameFinished, setIsGameFinished] = useState(false);

  const [currentRound, setCurrentRound] = useState(1);

  const [roundResults, setRoundResults] = useState<SkullKingRoundResult[]>([]);

  const [lootAlliances, setLootAlliances] = useState<LootAlliance[]>([]);

  const [isGameStarted, setIsGameStarted] = useState(false);

  const [isStorageLoaded, setIsStorageLoaded] = useState(shouldStartNewGame);

  const gamePlayers = useMemo(
    () =>
      players.map(
        (roundPlayer) =>
          roundPlayer.player,
      ),
    [players],
  );
  
  const standings = useMemo(
    () =>
      calculateStandings(
        gamePlayers,
        roundResults,
      ),
    [
      gamePlayers,
      roundResults,
    ],
  );

  const totalScores = new Map(
    standings.map((standing) => [
      standing.playerId,
      standing.totalScore
    ])
  );

  function restartWithPlayers() {
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

  useEffect(() => {
    if (shouldStartNewGame) {
      clearSkullKingGame();
      router.replace("/games/skull-king/single");
      return;
    }
  
    const savedGame = loadSkullKingGame();
  
    if (savedGame) {
      setPlayers(savedGame.players);
      setCurrentRound(savedGame.currentRound);
      setRoundResults(savedGame.roundResults);
      setLootAlliances(savedGame.lootAlliances);
      setIsGameStarted(savedGame.isGameStarted);
      setIsGameFinished(savedGame.isGameFinished);
    }
  
    setIsStorageLoaded(true);
  }, [shouldStartNewGame, router]);

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
      inputMode: "single-device"
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
    saveRecentGame("skull-king-single");
    const roundPlayers = createRoundPlayers(newPlayers);

    setPlayers(roundPlayers);
    setCurrentRound(1);
    setRoundResults([]);
    setLootAlliances([]);
    setIsGameFinished(false);
    setIsGameStarted(true);
  }

  function handleGoHome() {
    clearRecentGame();
    clearSkullKingGame();
    router.push("/");
  }

  function handleSubmit() {
    if (isGameFinished) {
      return;
    }
    saveRecentGame("skull-king-single");

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
    <>
      <div className="min-h-screen bg-board-bg">
        <main className="mx-auto flex w-full max-w-[393px] flex-col gap-6 p-6 font-sans text-board-text">

          {!isGameStarted ? (
            <GameSetup
              onStart={handleStartGame} />
          ) : (
            <>
              {isGameFinished ? (
                <GameResultScreen
                  players={gamePlayers}
                  standings={standings}
                  roundResults={roundResults}
                  onPlayAgain={restartWithPlayers}
                  onGoHome={handleGoHome}
                />
              ) : (
                <>
                  <RoundForm
                    round={currentRound}
                    players={players}
                    totalScores={totalScores}
                    lootAlliances={lootAlliances}
                    onPlayersChange={setPlayers}
                    onLootAlliancesChange={setLootAlliances}
                    onSubmit={handleSubmit} />

                  {roundResults.length > 0 && (
                    <>
                      <StandingsSection
                        standings={standings}
                      />

                      <RoundHistory
                        players={gamePlayers}
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
    </>
  );

}

export default function SkullKingPage() {
  return (
    <Suspense fallback={null}>
      <SkullKingPageContent />
    </Suspense>
  );
}
