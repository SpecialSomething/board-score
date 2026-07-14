"use client";

import { useState } from "react";

import type {
  LootAlliance,
  Player,
  SkullKingRoundInput,
  SkullKingRoundResult,
} from "@/features/skull-king/types";

import { calculateSkullKingRound } from "@/features/skull-king/calculator";

import RoundForm, {
  type RoundPlayer,
} from "@/features/skull-king/components/RoundForm";

import ScoreBoard from "@/features/skull-king/components/ScoreBoard";

import { MAX_ROUND } from "@/features/skull-king/constants";

import GameSetup from "@/features/skull-king/components/GameSetup";

const EMPTY_BONUSES = {
    standardFourteensCount: 0,
    blackFourteenCaptured: false,
    mermaidsCapturedByPirate: 0,
    piratesCapturedBySkullKing: 0,
    skullKingCapturedByMermaid: false, 
}

export default function SkullKingPage() {
  const [players, setPlayers] = useState<RoundPlayer[]>([]);

  const [isGameFinished, setIsGameFinished] = useState(false);

  const [currentRound, setCurrentRound] = useState(1);

  const [roundResults, setRoundResults] = useState<SkullKingRoundResult[]>([]);

  const [lootAlliances, setLootAlliances] = useState<LootAlliance[]>([]);

  const [isGameStarted, setIsGameStarted] = useState(false);

  const latestResult = roundResults[roundResults.length - 1];

  const totalScores = new Map<string, number>();

  for (const roundResult of roundResults) {
    for (const playerResult of roundResult.players) {
      const currentScore =
        totalScores.get(playerResult.playerId) ?? 0;

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

    setLootAlliances([]);

    const result = calculateSkullKingRound(input);

    setRoundResults((previousResults) => [
        ...previousResults,
        result,
    ]);

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
        </section>
      )}

    </main>
  );
}