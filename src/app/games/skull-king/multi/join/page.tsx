"use client";

import { useState } from "react";
import type {
  ComponentProps,
  ChangeEvent,
} from "react";

import { useRouter } from "next/navigation";

import { joinSkullKingRoom } from "@/features/skull-king/multiplayer/rooms";
import { normalizeRoomCode } from "@/features/skull-king/multiplayer/room-code";
import { saveMultiplayerSession } from "@/features/skull-king/multiplayer/session";

type FormSubmitHandler = NonNullable<
  ComponentProps<"form">["onSubmit"]
>;

export default function JoinSkullKingRoomPage() {
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isJoining, setIsJoining] =
    useState(false);

  const normalizedCode =
    normalizeRoomCode(roomCode);

  const trimmedName = playerName.trim();

  const canJoin =
    normalizedCode.length === 6 &&
    trimmedName.length >= 1 &&
    trimmedName.length <= 12 &&
    !isJoining;

  function handleRoomCodeChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextCode = normalizeRoomCode(
      event.target.value,
    ).slice(0, 6);

    setRoomCode(nextCode);
  }

  const handleSubmit: FormSubmitHandler =
    async (event) => {
      event.preventDefault();

      if (!canJoin) {
        return;
      }

      setIsJoining(true);
      setErrorMessage(null);

      try {
        const {
          roomId,
          roomCode: joinedRoomCode,
          playerId,
          playerName: joinedPlayerName,
        } = await joinSkullKingRoom(
          normalizedCode,
          trimmedName,
        );

        saveMultiplayerSession({
          roomId,
          roomCode: joinedRoomCode,
          playerId,
          playerName: joinedPlayerName,
          updatedAt: Date.now(),
        });

        router.push(
          `/games/skull-king/multi/${roomId}`,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "방에 참가하는 중 오류가 발생했습니다.";

        setErrorMessage(message);
      } finally {
        setIsJoining(false);
      }
    };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-board-text">
          방 참가하기
        </h2>
        <p className="mt-1 text-sm text-board-muted">
          방 코드와 사용할 이름을 입력하세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8"
      >
        <div>
          <label
            htmlFor="room-code"
            className="block text-base font-semibold text-board-text"
          >
            방 코드
          </label>

          <input
            id="room-code"
            type="text"
            value={roomCode}
            onChange={handleRoomCodeChange}
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="예: ABC123"
            className="mt-3 h-12 w-full rounded-xl border border-board-border bg-board-surface px-4 text-center text-xl font-semibold tracking-[0.25em] text-board-text outline-none focus:border-board-primary"
          />

          <p className="mt-2 text-sm text-board-subtext">
            {normalizedCode.length} / 6
          </p>
        </div>

        <div className="mt-6">
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
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-600"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!canJoin}
          className="mt-6 h-12 w-full rounded-xl bg-board-primary font-semibold text-white disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
        >
          {isJoining
            ? "참가하는 중..."
            : "참가하기"}
        </button>
      </form>
    </main>
  );
}