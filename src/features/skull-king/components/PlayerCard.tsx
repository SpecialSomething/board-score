"use client";

import { useState } from "react";

import type { SkullKingPlayerRoundInput } from "../types";
import BonusSection from "./BonusSection";
import NumberSelector from "./NumberSelector";

type PlayerCardProps = {
  playerName: string;
  round: number;
  value: SkullKingPlayerRoundInput;
  onChange: (value: SkullKingPlayerRoundInput) => void;
  disabled?: boolean;
};

export default function PlayerCard({
  playerName,
  round,
  value,
  onChange,
  disabled = false,
}: PlayerCardProps) {
  const [isBonusOpen, setIsBonusOpen] = useState(false);

  function clamp(amount: number, min: number, max: number): number {
    return Math.min(Math.max(amount, min), max);
  }

  return (
    <section className="flex w-full flex-col gap-3 rounded-xl border border-board-border bg-board-surface p-3">
      <h3 className="text-lg font-semibold leading-normal">{playerName}</h3>

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

      <button
        type="button"
        disabled={disabled}
        aria-expanded={isBonusOpen}
        onClick={() => setIsBonusOpen((open) => !open)}
        className="flex min-h-[39px] w-full items-center justify-between p-2.5 text-base font-semibold disabled:cursor-not-allowed disabled:text-board-disabled-text"
      >
        <span>보너스 입력</span>
        <span aria-hidden="true">{isBonusOpen ? "▲" : "▼"}</span>
      </button>

      {isBonusOpen && (
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
      )}
    </section>
  );
}
