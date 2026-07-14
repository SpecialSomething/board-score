"use client";

import type {
  LootAlliance,
  Player,
  PlayerId,
} from "../types";

type LootAllianceFormProps = {
  players: Player[];
  value: LootAlliance[];
  onChange: (alliances: LootAlliance[]) => void;
  disabled?: boolean;
};

export default function LootAllianceForm({
  players,
  value,
  onChange,
  disabled = false,
}: LootAllianceFormProps) {
  function updateLootAlliancePlayer(
    index: number,
    playerId: PlayerId
  ) {
    onChange(
      value.map((alliance, allianceIndex) =>
        allianceIndex === index
          ? {
              ...alliance,
              playerId,
            }
          : alliance
      )
    );
  }

  function updateLootAlliancePartner(
    index: number,
    partnerId: PlayerId
  ) {
    onChange(
      value.map((alliance, allianceIndex) =>
        allianceIndex === index
          ? {
              ...alliance,
              partnerId,
            }
          : alliance
      )
    );
  }

  function addLootAlliance() {
    if (disabled || value.length >= 2 || players.length < 2) {
      return;
    }

    onChange([
      ...value,
      {
        playerId: players[0].id,
        partnerId: players[1].id,
      },
    ]);
  }

  function removeLootAlliance(index: number) {
    onChange(
      value.filter(
        (_, allianceIndex) => allianceIndex !== index
      )
    );
  }

  return (
    <fieldset disabled={disabled}>
      <legend>약탈품 동맹</legend>

      {value.length === 0 && (
        <p>이번 라운드에는 등록된 약탈품 동맹이 없습니다.</p>
      )}

      {value.map((alliance, index) => (
        <div key={index}>
          <p>약탈품 {index + 1}</p>

          <label>
            약탈품을 낸 플레이어
            <select
              value={alliance.playerId}
              onChange={(event) =>
                updateLootAlliancePlayer(
                  index,
                  event.target.value
                )
              }
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            트릭을 획득한 플레이어
            <select
              value={alliance.partnerId}
              onChange={(event) =>
                updateLootAlliancePartner(
                  index,
                  event.target.value
                )
              }
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => removeLootAlliance(index)}
          >
            삭제
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addLootAlliance}
        disabled={
          disabled ||
          value.length >= 2 ||
          players.length < 2
        }
      >
        약탈품 동맹 추가
      </button>
    </fieldset>
  );
}