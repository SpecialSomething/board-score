"use client";

import { useState } from "react";

import type { SubmitEvent } from "react";

import { useRouter } from "next/navigation";

import Header from "@/components/Header";

import { createSkullKingRoom } from "@/features/skull-king/multiplayer/rooms";
import { saveMultiplayerSession } from "@/features/skull-king/multiplayer/session";

export default function CreateSkullKingRoomPage() {
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [isCreating, setIsCreating] =
    useState(false);

  const trimmedName = playerName.trim();

  const canCreate =
    trimmedName.length >= 1 &&
    trimmedName.length <= 12 &&
    !isCreating;

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canCreate) {
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      const {
        roomId,
        roomCode,
        playerId,
      } = await createSkullKingRoom(trimmedName);

      saveMultiplayerSession({
        roomId,
        roomCode,
        playerId,
        playerName: trimmedName,
        updatedAt: Date.now(),
      });

      router.push(
        `/games/skull-king/multi/${roomId}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "방을 만드는 중 오류가 발생했습니다.";

      setErrorMessage(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
      <Header
        title="방 만들기"
        description="게임에서 사용할 이름을 입력하세요."
      />

      <form
        onSubmit={handleSubmit}
        className="mt-8"
      >
        <label
          htmlFor="player-name"
          className="block text-base font-semibold text-board-text"
        >
          플레이어 이름
        </label>

        <input
          id="player-name"
          type="text"
          value={playerName}
          onChange={(event) =>
            setPlayerName(event.target.value)
          }
          maxLength={12}
          autoComplete="off"
          placeholder="이름 입력"
          className="mt-3 h-12 w-full rounded-xl border border-board-border bg-board-surface px-4 text-board-text outline-none focus:border-board-primary"
        />

        <p className="mt-2 text-sm text-board-subtext">
          {trimmedName.length} / 12
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-600"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!canCreate}
          className="mt-6 h-12 w-full rounded-xl bg-board-primary font-semibold text-white disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
        >
          {isCreating
            ? "방 만드는 중..."
            : "방 만들기"}
        </button>
      </form>
    </main>
  );
}