"use client";

import { useState } from "react";

import type {
  LootAlliance,
  PlayerId,
} from "../types";

import type {
  SkullKingRoomLootAlliance,
} from "../multiplayer/types";

import PlayerName from "./PlayerName";


import { MAX_LOOT_ALLIANCES } from "../constants";

type LootAlliancePlayer = {
  id: PlayerId;
  name: string;
};

type LootAllianceSectionProps = {
  currentPlayerId: PlayerId;
  allPlayers: LootAlliancePlayer[];
  lootAlliances: LootAlliance[];

  // 이번 라운드에 모든 사용자가 저장한 동맹
  allLootAlliances?: SkullKingRoomLootAlliance[];
  
  onChange: (lootAlliances: LootAlliance[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

export default function LootAllianceSection({
  currentPlayerId,
  allPlayers,
  lootAlliances,
  allLootAlliances = [],
  onChange,
  disabled = false,
  readOnly = false,
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
        alliance.giverId === currentPlayerId
    );

  const otherPlayersAllianceCount =
    allLootAlliances.filter(
      (alliance) =>
        alliance.createdByPlayerId !== currentPlayerId,
    ).length;
  
  const totalAllianceCount =
    otherPlayersAllianceCount +
    currentPlayerAlliances.length;
  
  const isAllianceLimitReached =
    totalAllianceCount >= MAX_LOOT_ALLIANCES;
  function addLootAlliance() {
    if (disabled || 
        selectedReceiverId === null ||
        isAllianceLimitReached
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
              disabled={disabled || isAllianceLimitReached}
              aria-disabled={disabled || readOnly}
              aria-pressed={isSelected || isAllianceLimitReached}
              onClick={() => {
                if (disabled || readOnly || isAllianceLimitReached) {
                  return;
                }
                  setSelectedReceiverId((currentId) =>
                    currentId === player.id ? null : player.id
                )}
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
          isAllianceLimitReached
        }
        onClick={addLootAlliance}
        className="h-10 w-full rounded-lg bg-board-primary font-semibold text-white transition-colors hover:bg-board-primary-hover disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
      >
        약탈품 동맹 추가
      </button>

      {currentPlayerAlliances.length > 0 && (
        <div className="mt-4 border-t border-board-border pt-4">
          <p className="text-sm font-semibold text-board-text">
            추가된 동맹
          </p>

          <div className="mt-3 flex flex-col gap-2">
          {currentPlayerAlliances.map(
            ({ alliance, index }) => (
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
        </div>
      )}

      {allLootAlliances.length > 0 && (
        <div className="mt-4 border-t border-board-border pt-4">
          <h3 className="text-sm font-semibold text-board-text">
            이번 라운드 약탈품 동맹
          </h3>
      
          <ul className="mt-3 space-y-2">
            {allLootAlliances.map((alliance) => {
              const giver = allPlayers.find(
                (player) =>
                  player.id ===
                  alliance.giverPlayerId,
              );
      
              const receiver = allPlayers.find(
                (player) =>
                  player.id ===
                  alliance.receiverPlayerId,
              );
      
              if (!giver || !receiver) {
                return null;
              }
      
              return (
                <li
                  key={alliance.id}
                  className="flex items-center gap-2 rounded-xl bg-board-secondary px-3 py-2 text-sm"
                >
                  <PlayerName
                    name={giver.name}
                    isMe={giver.id === currentPlayerId}
                    className="font-medium text-board-text"
                  />
                
                  <span className="text-board-text-muted">
                    →
                  </span>
                
                  <PlayerName
                    name={receiver.name}
                    isMe={receiver.id === currentPlayerId}
                    className="font-medium text-board-text"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>

    
  );
}