"use client";

import { useState } from "react";

import type {
  LootAlliance,
  Player,
  PlayerId,
} from "../types";

import { MAX_LOOT_ALLIANCES } from "../constants";

type LootAllianceSectionProps = {
  currentPlayerId: PlayerId;
  allPlayers: Player[];
  lootAlliances: LootAlliance[];
  onChange: (lootAlliances: LootAlliance[]) => void;
  disabled?: boolean;
};

export default function LootAllianceSection({
  currentPlayerId,
  allPlayers,
  lootAlliances,
  onChange,
  disabled = false,
}: LootAllianceSectionProps) {
  const [selectedReceiverId, setSelectedReceiverId] =
    useState<PlayerId | null>(null);

  // 현재 플레이어 자신을 제외한 플레이어만 선택할 수 있습니다.
  const selectablePlayers = allPlayers.filter(
    (player) => player.id !== currentPlayerId
  );

  /*
   * 현재 플레이어가 약탈품 카드를 낸 동맹만 표시합니다.
   *
   * 배열 전체에서의 index를 함께 저장하는 이유는
   * 동일한 두 플레이어의 동맹이 여러 개 있을 때
   * 선택한 동맹 하나만 정확히 삭제하기 위해서입니다.
   */
  const currentPlayerAlliances = lootAlliances
    .map((alliance, index) => ({
      alliance,
      index,
    }))
    .filter(
      ({ alliance }) => 
        alliance.giverId === currentPlayerId ||
        alliance.receiverId === currentPlayerId
    );

  const isAllianceLimitReached = lootAlliances.length >= MAX_LOOT_ALLIANCES;

  function addLootAlliance() {
    if (disabled || 
        selectedReceiverId === null ||
        lootAlliances.length >= MAX_LOOT_ALLIANCES
    ) {
      return;
    }

    onChange([
      ...lootAlliances,
      {
        giverId: currentPlayerId,
        receiverId: selectedReceiverId,
      },
    ]);

    setSelectedReceiverId(null);
  }

  function removeLootAlliance(allianceIndex: number) {
    if (disabled) {
      return;
    }

    onChange(
      lootAlliances.filter(
        (_, index) => index !== allianceIndex
      )
    );
  }

  function getPlayerName(playerId: PlayerId): string {
    return (
      allPlayers.find((player) => player.id === playerId)?.name ??
      "알 수 없는 플레이어"
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-board-border bg-board-surface p-3">
      <div>
        <h4 className="text-base font-semibold">약탈품 동맹</h4>
        <p className="mt-1 text-sm text-board-muted">
          약탈품 카드를 함께 획득한 플레이어를 선택하세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectablePlayers.map((player) => {
          const isSelected =
            selectedReceiverId === player.id;

          return (
            <button
              key={player.id}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() =>
                setSelectedReceiverId((currentId) =>
                  currentId === player.id ? null : player.id
                )
              }
              className={`flex min-w-[35px] h-[35px] px-3 whitespace-nowrap items-center justify-center rounded-xl text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text ${
                isSelected
                  ? "bg-board-primary text-white"
                  : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
              }`}
            >
              {player.name}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={
          disabled || 
          selectedReceiverId === null ||
          lootAlliances.length >= MAX_LOOT_ALLIANCES
        }
        onClick={addLootAlliance}
        className="h-10 w-full rounded-lg bg-board-primary font-semibold text-white transition-colors hover:bg-board-primary-hover disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
      >
        약탈품 동맹 추가
      </button>

      {currentPlayerAlliances.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-board-border pt-3">
          <p className="text-sm font-semibold text-board-text">
            추가된 동맹
          </p>

          {currentPlayerAlliances.map(
            ({ alliance, index }, displayIndex) => (
              <div
                key={`${alliance.giverId}-${alliance.receiverId}-${index}`}
                className="flex items-center justify-between rounded-lg bg-board-primary-soft px-3 py-2"
              >
                <span className="text-sm font-medium">
                  {getPlayerName(alliance.giverId)} - {getPlayerName(alliance.receiverId)}
                </span>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeLootAlliance(index)}
                  aria-label={`${getPlayerName(
                    alliance.receiverId
                  )}과의 약탈품 동맹 삭제`}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}