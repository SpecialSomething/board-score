"use client";

import PlayerRoundForm from "./PlayerRoundForm";

import LootAllianceForm from "./LootAllianceForm";

import type {
  LootAlliance,
  Player,
  SkullKingPlayerRoundInput,
} from "../types";

export type RoundPlayer = {
  player: Player;
  value: SkullKingPlayerRoundInput;
};

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
    const newPlayers = players.map((roundPlayer, playerIndex) => {
      if (playerIndex !== index) {
        return roundPlayer;
      }

      return {
        ...roundPlayer,
        value: newValue,
      };
    });

    onPlayersChange(newPlayers);
  }  

  return (
    <form onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
    }}>
      <header>
        <h2>{round}라운드</h2>
      </header>

      <div>
        {players.map((roundPlayer, index) => (
          <PlayerRoundForm
            key={roundPlayer.player.id}
            playerName={roundPlayer.player.name}
            round={round}
            value={roundPlayer.value}
            onChange={(newValue) =>
              updatePlayerValue(index, newValue)
            }
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

      <button type="submit" disabled={disabled}>
        라운드 계산
      </button>
    </form>
  );
}