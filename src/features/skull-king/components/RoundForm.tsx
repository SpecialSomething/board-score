"use client";

import type {
  LootAlliance,
  RoundPlayer,
  SkullKingPlayerRoundInput,
} from "../types";

import LootAllianceForm from "./LootAllianceForm";

import PlayerCard from "./PlayerCard";

import { calculateSkullKingRound } from "../calculator";

type RoundFormProps = {
  round: number;
  players: RoundPlayer[];
  totalScores: Map<string, number>;
  lootAlliances: LootAlliance[];
  onPlayersChange: (players: RoundPlayer[]) => void;
  onLootAlliancesChange: (alliances: LootAlliance[]) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export default function RoundForm({
  round,
  players,
  totalScores,
  lootAlliances,
  onPlayersChange,
  onLootAlliancesChange,
  onSubmit,
  disabled = false,
}: RoundFormProps) {
  function updatePlayerValue(
    index: number,
    newValue: SkullKingPlayerRoundInput
  ) {
    onPlayersChange(
      players.map((roundPlayer, playerIndex) =>
        playerIndex === index
          ? {
              ...roundPlayer,
              value: newValue,
            }
          : roundPlayer
      )
    );
  }

  const previewResult = calculateSkullKingRound({
    round,
    players: players.map((roundPlayer) => roundPlayer.value),
    lootAlliances,
  });

  const previewScores = new Map(
    previewResult.players.map((playerResult) => [
      playerResult.playerId,
      playerResult.roundScore,
    ])
  );

  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-board-border bg-board-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <header>
        <p className="text-sm font-medium leading-normal">Round {round}</p>
        <h1 className="text-xl font-semibold leading-normal">카드 {round}장</h1>
      </header>

      <div className="flex flex-col gap-5">
        {players.map((roundPlayer, index) => (
          <PlayerCard
            key={roundPlayer.player.id}
            playerName={roundPlayer.player.name}
            totalScore={
              totalScores.get(roundPlayer.player.id) ?? 0
            }
            previewScore={
              previewScores.get(roundPlayer.player.id) ?? 0
            }
            round={round}
            value={roundPlayer.value}
            onChange={(newValue) => updatePlayerValue(index, newValue)}
            disabled={disabled}
          />
        ))}
      </div>

      <LootAllianceForm
        players={players.map((roundPlayer) => roundPlayer.player)}
        value={lootAlliances}
        onChange={onLootAlliancesChange}
        disabled={disabled}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="h-12 w-full rounded-xl bg-board-primary font-semibold text-white transition-colors hover:bg-board-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
      >
        이번 라운드 저장
      </button>
    </div>
  );
}
