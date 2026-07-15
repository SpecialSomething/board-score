"use client";

import { useState } from "react";

import { MAX_PLAYERS, MIN_PLAYERS } from "../constants";
import type { Player } from "../types";

type GameSetupProps = {
  onStart: (players: Player[]) => void;
};

const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, index) => MIN_PLAYERS + index
);

export default function GameSetup({ onStart }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [error, setError] = useState("");
  const canStart = playerNames.every(name => name.trim() !== "") && 
  new Set(playerNames.map(name => name.trim())).size === playerNames.length;

  function updatePlayerCount(count: number) {
    setPlayerCount(count);
    setError("");

    setPlayerNames((currentNames) => {
      if (count > currentNames.length) {
        return [
          ...currentNames,
          ...Array(count - currentNames.length).fill(""),
        ];
      }

      return currentNames.slice(0, count);
    });
  }

  function updatePlayerName(index: number, name: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName
      )
    );
  }

  function handleStart() {
    const trimmedNames = playerNames.map((name) => name.trim());

    if (trimmedNames.some((name) => name === "")) {
      setError("모든 플레이어의 이름을 입력해주세요.");
      return;
    }

    const uniqueNames = new Set(trimmedNames);

    if (uniqueNames.size !== trimmedNames.length) {
      setError("같은 이름을 사용할 수 없습니다.");
      return;
    }

    setError("");

    const players: Player[] = trimmedNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name,
    }));

    onStart(players);
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <section className="mx-auto flex w-full max-w-[393px] flex-col gap-4 p-6 font-sans text-black">
        <header>
          <h1 className="text-[28px] font-bold leading-normal tracking-tight">
            Skull King 스컬킹
          </h1>
          <p className="mt-1 text-[15px] leading-normal">
            게임을 시작해볼까요?
          </p>
        </header>

        <div className="flex flex-col gap-5 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl font-semibold leading-normal">게임 설정</h2>

          <fieldset>
            <legend className="text-base font-semibold leading-normal">
              플레이어 수
            </legend>
            <div className="mt-5 flex items-center justify-center gap-2">
              {PLAYER_COUNTS.map((count) => {
                const isSelected = playerCount === count;

                return (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updatePlayerCount(count)}
                    className={`flex size-[35px] shrink-0 items-center justify-center rounded-xl text-base font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                      isSelected
                        ? "bg-[#767676] text-white"
                        : "bg-[#dddddd] text-black hover:bg-[#cecece]"
                    }`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <h3 className="text-base font-semibold leading-normal">
              플레이어 이름
            </h3>
            <div className="mt-5 flex flex-col gap-5">
              {playerNames.map((name, index) => {
                const inputId = `player-name-${index + 1}`;

                return (
                  <div key={inputId}>
                    <label
                      htmlFor={inputId}
                      className="block text-base font-semibold leading-normal"
                    >
                      플레이어 {index + 1}
                    </label>
                    <input
                      id={inputId}
                      type="text"
                      value={name}
                      placeholder="이름을 입력하세요"
                      autoComplete="off"
                      onChange={(event) =>
                        updatePlayerName(index, event.target.value)
                      }
                      className="mt-1 h-12 w-full rounded-xl bg-[#f7f7f7] px-3 text-base font-medium text-black outline-none placeholder:text-[#999] focus:ring-2 focus:ring-[#767676]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-base font-semibold leading-normal text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className={`flex h-[35px] w-full items-center justify-center rounded-xl text-base font-semibold transition-colors
            ${
              canStart
                ? "bg-black text-white hover:bg-[#333]"
                : "bg-[#dddddd] text-[#767676]"
            }`}
          >
            게임 시작
          </button>
        </div>
      </section>
    </div>
  );
}
