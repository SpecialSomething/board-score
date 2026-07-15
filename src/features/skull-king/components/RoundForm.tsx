"use client";

import type {
  LootAlliance,
  RoundPlayer,
  SkullKingPlayerRoundInput,
} from "../types";
import LootAllianceForm from "./LootAllianceForm";
import PlayerCard from "./PlayerCard";

type RoundFormProps = {
  round: number;
  players: RoundPlayer[];
  lootAlliances: LootAlliance[];
  onPlayersChange: (players: RoundPlayer[]) => void;
  onLootAlliancesChange: (alliances: LootAlliance[]) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export default function RoundForm({
  round,
  players,
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

  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <header>
        <p className="text-sm font-medium leading-normal">Round {round}</p>
        <h1 className="text-xl font-semibold leading-normal">카드 {round}장</h1>
      </header>

      <div className="flex flex-col gap-5">
        {players.map((roundPlayer, index) => (
          <PlayerCard
            key={roundPlayer.player.id}
            playerName={roundPlayer.player.name}
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
        className="h-11 w-full rounded-xl bg-[#767676] text-base font-semibold text-white transition-colors hover:bg-[#666666] disabled:cursor-not-allowed disabled:bg-[#dddddd] disabled:text-[#989898]"
      >
        이번 라운드 저장
      </button>
    </div>
  );
}
