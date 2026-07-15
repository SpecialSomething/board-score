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

import ScoreBoard from "@/features/skull-king/components/ScoreBoard";

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

  const latestResult = roundResults[roundResults.length - 1];

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

  function handleResetGame() {
    clearSkullKingGame();

    setPlayers([]);
    setCurrentRound(1);
    setRoundResults([]);
    setLootAlliances([]);
    setIsGameFinished(false);
    setIsGameStarted(false);
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
      <main>
        <p>게임을 불러오는 중입니다...</p>
      </main>
    );
  }


  if (!isGameStarted) {
    return(
        <main>
            <GameSetup onStart={handleStartGame}/>
        </main>
    );
  }

  return (
    <main>
      <h1>스컬 킹 점수 계산기</h1>

      <RoundForm
        round={currentRound}
        players={players}
        lootAlliances={lootAlliances}
        onPlayersChange={setPlayers}
        onLootAlliancesChange={setLootAlliances}
        onSubmit={handleSubmit}
        disabled={isGameFinished}
      />

      {latestResult && (
        <ScoreBoard
            players = {players.map((roundPlayer) => roundPlayer.player)}
            result = {latestResult}
        />
      )}

      {roundResults.length > 0 && (
        <section>
            <h2>
                {isGameFinished ? "최종 순위" : "현재 순위"}
            </h2>

            <ol>
                {standings.map((player) => (
                    <li key={player.playerId}>
                        {player.playerName} : {player.totalScore}점
                    </li>
                ))}
            </ol>

            {isGameFinished && (
                <button
                    type="button"
                    onClick={handleResetGame}
                >
                  새 게임
                </button>
            )}

        </section>
      )}
      
      {roundResults.length > 0 && (
        <details>
          <summary>라운드별 점수 보기</summary>
        
          <RoundHistory
            players={players.map((roundPlayer) => roundPlayer.player)}
            results={roundResults}
          />
        </details>
      )} 
    </main>
  );
}