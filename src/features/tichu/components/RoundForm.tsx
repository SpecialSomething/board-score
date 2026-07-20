"use client";

import { useMemo, useState } from "react";

import {
  CARD_SCORE_STEP,
  MAX_CARD_SCORE,
  MIN_CARD_SCORE,
  NORMAL_ROUND_TOTAL_SCORE,
} from "../constants";
import { createTichuRoundInput } from "../factories";
import type {
  TichuPlayer,
  TichuRoundInput,
  TichuTeamId,
} from "../types";
import DeclarationSection from "./DeclarationSection";

type RoundFormProps = {
  players: TichuPlayer[];
  round: number;
  onSubmit: (input: TichuRoundInput) => void;
};

const ONE_TWO_OPTIONS: {
  label: string;
  value: TichuTeamId | null;
}[] = [
  {
    label: "없음",
    value: null,
  },
  {
    label: "1팀",
    value: 1,
  },
  {
    label: "2팀",
    value: 2,
  },
];

function clampCardScore(score: number): number {
  return Math.min(
    MAX_CARD_SCORE,
    Math.max(MIN_CARD_SCORE, score),
  );
}

export default function RoundForm({
  players,
  round,
  onSubmit,
}: RoundFormProps) {
  const [input, setInput] = useState<TichuRoundInput>(
    () => createTichuRoundInput(round),
  );
  const [error, setError] = useState("");

  const teamNames = useMemo(() => {
    return {
      1: players
        .filter((player) => player.teamId === 1)
        .map((player) => player.name)
        .join(" · "),
      2: players
        .filter((player) => player.teamId === 2)
        .map((player) => player.name)
        .join(" · "),
    };
  }, [players]);

  const incompleteDeclaration =
    input.declarations.some(
      (declaration) =>
        declaration.success === null,
    );

  const canSubmit = !incompleteDeclaration;

  function updateTeamOneCardScore(
    nextScore: number,
  ) {
    const teamOneScore =
      clampCardScore(nextScore);

    setInput((currentInput) => ({
      ...currentInput,
      cardScores: {
        1: teamOneScore,
        2:
          NORMAL_ROUND_TOTAL_SCORE -
          teamOneScore,
      },
    }));

    setError("");
  }

  function changeTeamOneCardScore(
    amount: number,
  ) {
    updateTeamOneCardScore(
      input.cardScores[1] + amount,
    );
  }

  function updateOneTwoTeamId(
    teamId: TichuTeamId | null,
  ) {
    setInput((currentInput) => ({
      ...currentInput,
      oneTwoTeamId: teamId,
    }));

    setError("");
  }

  function handleSubmit() {
    if (incompleteDeclaration) {
      setError(
        "선언한 티츄의 성공 또는 실패를 선택해주세요.",
      );
      return;
    }

    setError("");

    onSubmit({
      ...input,
      round,
    });
  }

  return (
    <section className="mt-6 flex w-full flex-col gap-4 font-sans text-board-text">
      <header>
        <h1 className="text-[28px] font-bold leading-normal tracking-tight">
          {round}라운드
        </h1>

        <p className="mt-1 text-[15px] leading-normal">
          이번 라운드의 결과를 입력해주세요.
        </p>
      </header>

      <div className="flex flex-col gap-6 overflow-hidden rounded-2xl bg-board-surface p-5 shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
        <section>
          <h2 className="text-xl font-semibold leading-normal">
            카드 점수
          </h2>

          <p className="mt-1 text-sm leading-normal text-board-disabled-text">
            1팀 점수를 입력하면 2팀 점수는 자동으로 계산됩니다.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <div className="rounded-2xl bg-board-bg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">
                    1팀
                  </p>

                  <p className="mt-0.5 text-sm text-board-disabled-text">
                    {teamNames[1]}
                  </p>
                </div>

                <p className="text-2xl font-bold">
                  {input.cardScores[1]}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="1팀 카드 점수 5점 감소"
                  onClick={() =>
                    changeTeamOneCardScore(
                      -CARD_SCORE_STEP,
                    )
                  }
                  disabled={
                    input.oneTwoTeamId !== null ||
                    input.cardScores[1] <=
                      MIN_CARD_SCORE
                  }
                  className="flex h-10 flex-1 items-center justify-center rounded-xl bg-board-secondary text-lg font-semibold transition-colors hover:bg-board-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
                >
                  −
                </button>

                <input
                  aria-label="1팀 카드 점수"
                  type="number"
                  min={MIN_CARD_SCORE}
                  max={MAX_CARD_SCORE}
                  step={CARD_SCORE_STEP}
                  value={input.cardScores[1]}
                  disabled={
                    input.oneTwoTeamId !== null
                  }
                  onChange={(event) => {
                    const value = Number(
                      event.target.value,
                    );

                    if (!Number.isNaN(value)) {
                      updateTeamOneCardScore(
                        value,
                      );
                    }
                  }}
                  className="h-10 w-24 rounded-xl bg-board-surface px-2 text-center text-base font-semibold outline-none focus:ring-2 focus:ring-board-primary disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
                />

                <button
                  type="button"
                  aria-label="1팀 카드 점수 5점 증가"
                  onClick={() =>
                    changeTeamOneCardScore(
                      CARD_SCORE_STEP,
                    )
                  }
                  disabled={
                    input.oneTwoTeamId !== null ||
                    input.cardScores[1] >=
                      MAX_CARD_SCORE
                  }
                  className="flex h-10 flex-1 items-center justify-center rounded-xl bg-board-secondary text-lg font-semibold transition-colors hover:bg-board-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
                >
                  +
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-board-bg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">
                    2팀
                  </p>

                  <p className="mt-0.5 text-sm text-board-disabled-text">
                    {teamNames[2]}
                  </p>
                </div>

                <p className="text-2xl font-bold">
                  {input.cardScores[2]}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold leading-normal">
            원투
          </h2>

          <p className="mt-1 text-sm leading-normal text-board-disabled-text">
            한 팀의 두 플레이어가 1등과 2등을 모두 차지했다면 선택해주세요.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {ONE_TWO_OPTIONS.map(
              (option) => {
                const isSelected =
                  input.oneTwoTeamId ===
                  option.value;

                return (
                  <button
                    key={
                      option.value ?? "none"
                    }
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      updateOneTwoTeamId(
                        option.value,
                      )
                    }
                    className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary ${
                      isSelected
                        ? "bg-board-primary text-white"
                        : "bg-board-secondary text-board-text hover:bg-board-primary-soft"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              },
            )}
          </div>
        </section>

        <DeclarationSection
          players={players}
          declarations={input.declarations}
          onChange={(declarations) => {
            setInput((currentInput) => ({
              ...currentInput,
              declarations,
            }));
            setError("");
          }}
        />

        {error && (
          <p
            role="alert"
            className="text-base font-semibold leading-normal text-board-danger"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex h-[35px] w-full items-center justify-center rounded-xl text-base font-semibold transition-colors ${
            canSubmit
              ? "bg-board-primary text-white hover:bg-board-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary"
              : "cursor-not-allowed bg-board-disabled text-board-disabled-text"
          }`}
        >
          라운드 저장
        </button>
      </div>
    </section>
  );
}