"use client";

import type { LootAlliance, Player, PlayerId } from "../types";

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
  function updateAlliance(
    index: number,
    key: "playerId" | "partnerId",
    playerId: PlayerId
  ) {
    onChange(
      value.map((alliance, allianceIndex) =>
        allianceIndex === index
          ? {
              ...alliance,
              [key]: playerId,
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

  return (
    <fieldset
      disabled={disabled}
      className="flex w-full flex-col gap-3 rounded-xl border border-board-border bg-board-surface p-3"
    >
      <legend className="sr-only">약탈품 동맹</legend>
      <h3 className="text-base font-semibold">약탈품 동맹</h3>

      {value.length === 0 && (
        <p className="text-base font-semibold text-board-muted">
          등록된 동맹 없음
        </p>
      )}

      {value.map((alliance, index) => (
        <section
          key={index}
          className="flex flex-col gap-3 rounded-xl bg-board-surface p-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">약탈품 {index + 1}</h4>
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange(
                  value.filter(
                    (_, allianceIndex) => allianceIndex !== index
                  )
                )
              }
              className="rounded-lg px-2 py-1 text-sm font-semibold text-board-danger disabled:text-board-disabled-text"
            >
              삭제
            </button>
          </div>

          <label className="text-sm font-semibold">
            약탈품을 낸 플레이어
            <select
              value={alliance.playerId}
              disabled={disabled}
              onChange={(event) =>
                updateAlliance(index, "playerId", event.target.value)
              }
              className="mt-1 h-10 w-full rounded-xl bg-board-bg px-3 text-base disabled:text-board-disabled-text"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            트릭을 획득한 플레이어
            <select
              value={alliance.partnerId}
              disabled={disabled}
              onChange={(event) =>
                updateAlliance(index, "partnerId", event.target.value)
              }
              className="mt-1 h-10 w-full rounded-xl bg-board-bg px-3 text-base disabled:text-board-disabled-text"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      ))}

      <button
        type="button"
        onClick={addLootAlliance}
        disabled={disabled || value.length >= 2 || players.length < 2}
        className="h-[35px] w-full rounded-xl bg-board-secondary text-base font-semibold text-board-text transition-colors hover:bg-board-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
      >
        + 동맹 추가
      </button>
    </fieldset>
  );
}
