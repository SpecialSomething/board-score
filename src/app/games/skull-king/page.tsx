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

import { RoundPlayer } from "@/features/skull-king/types";

import { MAX_ROUND } from "@/features/skull-king/constants";

import GameSetup from "@/features/skull-king/components/GameSetup";

import RoundHistory from "@/features/skull-king/components/RoundHistory";

const EMPTY_BONUSES = {
    standardFourteensCount: 0,
    blackFourteenCaptured: false,
    mermaidsCapturedByPirate: 0,
    piratesCapturedBySkullKing: 0,
    skullKingCapturedByMermaid: false, 
}

export default function SkullKingPage() {
  const router = useRouter();

  const [players, setPlayers] = useState<RoundPlayer[]>([]);

  const [isGameFinished, setIsGameFinished] = useState(false);

  const [currentRound, setCurrentRound] = useState(1);

  const [roundResults, setRoundResults] = useState<SkullKingRoundResult[]>([]);

  const [lootAlliances, setLootAlliances] = useState<LootAlliance[]>([]);

  const [isGameStarted, setIsGameStarted] = useState(false);

  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const totalScores = new Map<string, number>();

  

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

  for (const roundResult of roundResults) {
    for (const playerResult of roundResult.players) {
      const currentScore = totalScores.get(playerResult.playerId) ?? 0;

      totalScores.set(
        playerResult.playerId,
        currentScore + playerResult.roundScore
      );
    }
  }
  
  const standings = players.map((roundPlayer) => ({
    playerId: roundPlayer.player.id,
    playerName: roundPlayer.player.name,
    totalScore: totalScores.get(roundPlayer.player.id) ?? 0,
  })).sort((a, b) => b.totalScore - a.totalScore);

  function resetPlayerInputs(
    currentPlayers: RoundPlayer[]
  ): RoundPlayer[] {
    return currentPlayers.map((roundPlayer) => ({
        ...roundPlayer,
        value: {
            ...roundPlayer.value,
            bid: 0,
            tricks: 0,
            bonuses: EMPTY_BONUSES,
        },
    }));
  }

  function handleStartGame(newPlayers: Player[]) {
    const roundPlayers: RoundPlayer[] = newPlayers.map((player) => ({
        player,
        value: {
            playerId: player.id,
            bid: 0,
            tricks: 0,
            bonuses: {
                ...EMPTY_BONUSES,
            },
        },
    }));

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
      resetPlayerInputs(currentPlayers)
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
        setPlayers((currentPlayer) => resetPlayerInputs(currentPlayer));
        setCurrentRound((round) => round + 1);
    }

    console.log(`===== Round ${input.round} =====`);

    console.table(
        input.players.map((player) => ({
            playerId: player.playerId,
            bid: player.bid,
            tricks: player.tricks,
            standard14: player.bonuses.standardFourteensCount,
            black14: player.bonuses.blackFourteenCaptured,
            pirateMermaid: player.bonuses.mermaidsCapturedByPirate,
            skullKingPirate: player.bonuses.piratesCapturedBySkullKing,
            mermaidSkullKing: player.bonuses.skullKingCapturedByMermaid,
        }))
    );
  }

  if (!isStorageLoaded) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] p-6">
        <p className="mx-auto w-full max-w-[393px]">게임을 불러오는 중입니다...</p>
      </main>
    );
  }

  if (!isGameStarted) {
    return (
      <main>
        <GameSetup onStart={handleStartGame} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <main className="mx-auto flex w-full max-w-[393px] flex-col gap-6 p-6 font-sans text-black">
        {!isGameFinished && (
          <RoundForm
            round={currentRound}
            players={players}
            lootAlliances={lootAlliances}
            onPlayersChange={setPlayers}
            onLootAlliancesChange={setLootAlliances}
            onSubmit={handleSubmit}
          />
        )}

        {roundResults.length > 0 && (
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <h2 className="text-xl font-semibold">
              {isGameFinished ? "최종 순위" : "현재 순위"}
            </h2>

            <ol className="mt-4 flex flex-col gap-2">
              {standings.map((player, index) => (
                <li
                  key={player.playerId}
                  className="flex items-center justify-between rounded-xl bg-[#f7f7f7] px-3 py-2.5"
                >
                  <span className="font-semibold">
                    {index + 1}. {player.playerName}
                  </span>
                  <strong>{player.totalScore}점</strong>
                </li>
              ))}
            </ol>

            {isGameFinished && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="mt-4 h-11 w-full rounded-xl bg-[#767676] font-semibold text-white"
                >
                  한 판 더?
                </button>
              
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="mt-4 h-11 w-full rounded-xl bg-[#767676] font-semibold text-white"
                >
                  홈으로
                </button>
              </div>
            )}
          </section>
        )}

        {roundResults.length > 0 && (
          <RoundHistory
            players={players.map((roundPlayer) => roundPlayer.player)}
            results={roundResults}
          />
        )}
      </main>
    </div>
  );
}
