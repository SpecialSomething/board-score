"use client";

import { useState } from "react";

import { DEFAULT_TARGET_SCORE } from "../constants";
import { createTichuPlayer } from "../factories";
import type {
  TichuPlayer,
  TichuSeat,
  TichuTeamId,
} from "../types";

type GameSetupProps = {
  onStart: (
    players: TichuPlayer[],
    targetScore: number,
  ) => void;
};

const SEATS: TichuSeat[] = [1, 2, 3, 4];

function getTeamIdBySeat(
  seat: TichuSeat,
): TichuTeamId {
  return seat === 1 || seat === 3 ? 1 : 2;
}

export default function GameSetup({
  onStart,
}: GameSetupProps) {
  const [playerNames, setPlayerNames] =
    useState<string[]>(["", "", "", ""]);

  const [targetScore, setTargetScore] =
    useState(DEFAULT_TARGET_SCORE);

  const [error, setError] = useState("");

  const trimmedNames = playerNames.map((name) =>
    name.trim(),
  );

  const normalizedNames = trimmedNames.map((name) =>
    name.toLowerCase(),
  );

  const hasEmptyName = trimmedNames.some(
    (name) => name === "",
  );

  const hasDuplicateName =
    new Set(normalizedNames).size !==
    normalizedNames.length;

  const isTargetScoreValid =
    Number.isInteger(targetScore) &&
    targetScore > 0;

  const canStart =
    !hasEmptyName &&
    !hasDuplicateName &&
    isTargetScoreValid;

  function updatePlayerName(
    index: number,
    name: string,
  ) {
    setPlayerNames((currentNames) =>
      currentNames.map(
        (currentName, currentIndex) =>
          currentIndex === index
            ? name
            : currentName,
      ),
    );

    setError("");
  }

  function updateTargetScore(value: string) {
    if (value === "") {
      setTargetScore(0);
      return;
    }

    const nextTargetScore = Number(value);

    if (Number.isNaN(nextTargetScore)) {
      return;
    }

    setTargetScore(nextTargetScore);
    setError("");
  }

  function handleStart() {
    if (hasEmptyName) {
      setError(
        "모든 플레이어의 이름을 입력해주세요.",
      );
      return;
    }

    if (hasDuplicateName) {
      setError(
        "같은 이름을 사용할 수 없습니다.",
      );
      return;
    }

    if (!isTargetScoreValid) {
      setError(
        "목표 점수는 1 이상의 정수여야 합니다.",
      );
      return;
    }

    const players = SEATS.map(
      (seat, index) =>
        createTichuPlayer(
          `player-${seat}`,
          trimmedNames[index],
          getTeamIdBySeat(seat),
          seat,
        ),
    );

    setError("");
    onStart(players, targetScore);
  }

  return (
    <section className="flex w-full flex-col gap-4 font-sans text-board-text">
      <header>
        <h1 className="text-[28px] font-bold leading-normal tracking-tight">
          Tichu 티츄
        </h1>

        <p className="mt-1 text-[15px] leading-normal">
          게임을 시작해볼까요?
        </p>
      </header>

      <div className="flex flex-col gap-5 overflow-hidden rounded-2xl bg-board-surface p-5 shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
        <h2 className="text-xl font-semibold leading-normal">
          게임 설정
        </h2>

        <div>
          <h3 className="text-base font-semibold leading-normal">
            플레이어 이름
          </h3>

          <p className="mt-1 text-sm text-board-disabled-text">
            마주 보는 플레이어끼리 같은 팀입니다.
          </p>

          <div className="mt-5 flex flex-col gap-5">
            {SEATS.map((seat, index) => {
              const inputId =
                `player-name-${seat}`;

              const teamId =
                getTeamIdBySeat(seat);

              return (
                <div key={seat}>
                  <label
                    htmlFor={inputId}
                    className="flex items-center justify-between text-base font-semibold leading-normal"
                  >
                    <span>
                      플레이어 {seat}
                    </span>

                    <span className="rounded-xl bg-board-primary-soft px-3 py-1 text-sm text-board-primary">
                      {teamId}팀
                    </span>
                  </label>

                  <input
                    id={inputId}
                    type="text"
                    value={playerNames[index]}
                    placeholder="이름을 입력하세요"
                    autoComplete="off"
                    maxLength={20}
                    onChange={(event) =>
                      updatePlayerName(
                        index,
                        event.target.value,
                      )
                    }
                    className="mt-1 h-12 w-full rounded-xl bg-board-bg px-3 text-base font-medium text-board-text outline-none placeholder:text-board-disabled-text focus:ring-2 focus:ring-board-primary"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="target-score"
            className="block text-base font-semibold leading-normal"
          >
            목표 점수
          </label>

          <input
            id="target-score"
            type="number"
            min={1}
            step={100}
            value={targetScore || ""}
            onChange={(event) =>
              updateTargetScore(
                event.target.value,
              )
            }
            className="mt-1 h-12 w-full rounded-xl bg-board-bg px-3 text-base font-medium text-board-text outline-none placeholder:text-board-disabled-text focus:ring-2 focus:ring-board-primary"
          />
        </div>

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
          onClick={handleStart}
          disabled={!canStart}
          className={`flex h-[35px] w-full items-center justify-center rounded-xl text-base font-semibold transition-colors ${
            canStart
              ? "bg-board-primary text-white hover:bg-board-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary"
              : "cursor-not-allowed bg-board-disabled text-board-disabled-text"
          }`}
        >
          게임 시작
        </button>
      </div>
    </section>
  );
}