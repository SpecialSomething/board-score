"use client";

import { useState, useEffect } from "react";

import type { 
  SkullKingPlayerRoundInput,
  LootAlliance,
  Player,
  PlayerId
} from "../types";

import BonusSection from "./BonusSection";

import NumberSelector from "./NumberSelector";

import LootAllianceSection from "./LootAllianceSection";

type PlayerCardProps = {
  playerId: PlayerId;
  playerName: string;
  allPlayers: Player[];
  lootAlliances: LootAlliance[];
  onLootAlliancesChange: (lootAlliances: LootAlliance[]) => void;
  totalScore: number;
  previewScore: number;
  round: number;
  value: SkullKingPlayerRoundInput;
  onChange: (value: SkullKingPlayerRoundInput) => void;
  disabled?: boolean;
};

export default function PlayerCard({
  playerId,
  playerName,
  allPlayers,
  lootAlliances,
  onLootAlliancesChange,
  totalScore,
  previewScore,
  round,
  value,
  onChange,
  disabled = false,
}: PlayerCardProps) {
  const [isBonusOpen, setIsBonusOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsBonusOpen(false);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [round]);

  function clamp(amount: number, min: number, max: number): number {
    return Math.min(Math.max(amount, min), max);
  }

  return (
    <section className="flex w-full flex-col gap-3 rounded-xl border border-board-border bg-board-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold leading-normal">{playerName}</h3>
        <strong className="text-base font-semibold text-board-primary">현재 {totalScore}점</strong>
      </div>
      <NumberSelector
        label="예측"
        value={value.bid}
        max={round}
        onChange={(bid) =>
          onChange({
            ...value,
            bid: clamp(bid, 0, round),
          })
        }
        disabled={disabled}
      />

      <NumberSelector
        label="실제"
        value={value.tricks}
        max={round}
        onChange={(tricks) =>
          onChange({
            ...value,
            tricks: clamp(tricks, 0, round),
          })
        }
        disabled={disabled}
      />

      <div className="flex items-center justify-between py-2">
        <span className="font-semibold text-gray-700">
          예상 점수
        </span>
      
        <strong
          className={`text-lg font-bold ${
            previewScore > 0
              ? "text-board-primary"
              : previewScore < 0
                ? "text-red-600"
                : "text-board-muted"
          }`}
        >
          {previewScore > 0 ? "+" : ""}
          {previewScore}점
        </strong>
      </div>
      
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isBonusOpen}
        onClick={() => setIsBonusOpen((open) => !open)}
        className="flex w-full items-center justify-between rounded-xl py-2 text-left text-base font-semibold text-board-text transition-colors hover:bg-board-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>보너스 입력</span>
        <span aria-hidden="true">{isBonusOpen ? "▲" : "▼"}</span>
      </button>

      {isBonusOpen && (
        <div className= "flex flex-col gap-4">
          <BonusSection
            value={value.bonuses}
            onChange={(bonuses) =>
              onChange({
                ...value,
                bonuses,
              })
            }
            disabled={disabled}
          />

          <LootAllianceSection
            currentPlayerId={playerId}
            allPlayers={allPlayers}
            lootAlliances={lootAlliances}
            onChange={onLootAlliancesChange}
            disabled={disabled}
          />
        </div>
      )}
    </section>
  );
}
