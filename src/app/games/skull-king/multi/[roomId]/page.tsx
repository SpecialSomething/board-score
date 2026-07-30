"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { useParams, useRouter, } from "next/navigation";

import Header from "@/components/Header";

import {
  getSkullKingRoom,
  getSkullKingRoomPlayers,
  updateSkullKingPlayerReady,
  startSkullKingGame,
} from "@/features/skull-king/multiplayer/rooms";

import {
  loadMultiplayerSession,
} from "@/features/skull-king/multiplayer/session";

import { saveRecentGame } from "@/features/recent-game/storage";

type Room = Awaited<
  ReturnType<typeof getSkullKingRoom>
>;

type RoomPlayer = Awaited<
  ReturnType<typeof getSkullKingRoomPlayers>
>[number];

type MultiplayerSession =
  ReturnType<typeof loadMultiplayerSession>;

export default function SkullKingRoomPage() {
  const params = useParams<{ roomId: string }>();

  const router = useRouter();

  const [room, setRoom] =
    useState<Room | null>(null);

  const [players, setPlayers] =
    useState<RoomPlayer[]>([]);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUpdatingReady, setIsUpdatingReady] =
    useState(false);  
  const [readyError, setReadyError] =
    useState<string | null>(null);
  
  const [
    multiplayerSession,
    setMultiplayerSession,
  ] = useState<MultiplayerSession>(null);
  
  const [isSessionLoaded, setIsSessionLoaded] =
    useState(false);

  const [isStartingGame, setIsStartingGame] =
    useState(false);
  
  const [startError, setStartError] =
    useState<string | null>(null);

  useEffect(() => {
    const savedSession =
      loadMultiplayerSession();
  
    queueMicrotask(() => {
      setMultiplayerSession(savedSession);
      setIsSessionLoaded(true);
    });
  }, []);

  const loadRoomData = useCallback(async () => {
    try {
      const [nextRoom, nextPlayers] =
        await Promise.all([
          getSkullKingRoom(params.roomId),
          getSkullKingRoomPlayers(params.roomId),
        ]);
    
      if (
        nextRoom.status === "bidding" || 
        nextRoom.status === "scoring"
      ) {
        router.replace(
          `/games/skull-king/multi/${nextRoom.id}/play`,
        );
      
        return;
      }

      if (
        nextRoom.status === "finished"
      ) {
        router.replace(
          `/games/skull-king/multi/${nextRoom.id}/result`,
        );
      
        return;
      }

      setRoom(nextRoom);
      setPlayers(nextPlayers);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "대기실 정보를 불러오지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [params.roomId, router]);

  useEffect(() => {
    if (
      !isSessionLoaded ||
      !multiplayerSession ||
      multiplayerSession.roomId !== params.roomId
    ) {
      return;
    }

    saveRecentGame("skull-king-multi");
  
    const timeoutId = window.setTimeout(() => {
      void loadRoomData();
    }, 0);
  
    const intervalId = window.setInterval(() => {
      void loadRoomData();
    }, 1000);
  
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [
    isSessionLoaded,
    multiplayerSession,
    params.roomId,
    loadRoomData,
  ]);

  if (!isSessionLoaded) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
        <Header title="스컬킹 대기실" />
  
        <p className="mt-8 text-board-subtext">
          참가 정보를 확인하는 중입니다.
        </p>
      </main>
    );
  }

  if (!multiplayerSession || multiplayerSession.roomId !== params.roomId) {
      return (
          <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6">
              <Header title="스컬킹" />  
              <p className="mt-8 text-board-text">
                  이 방의 참가 정보가 없습니다.
              </p>  
              <Link
                  href="/games/skull-king/multi/join"
                  className="mt-6 flex h-12 items-center justify-center rounded-xl bg-board-primary font-semibold text-white"
              >
                  방 참가하기
              </Link>
          </main>
      );
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
        <Header title="스컬킹 대기실" />

        <p className="mt-8 text-board-subtext">
          대기실을 불러오는 중입니다.
        </p>
      </main>
    );
  }

  
  
  const currentPlayer =
    players.find(
      (player) =>
        player.id === multiplayerSession?.playerId,
    ) ?? null;

  const isCurrentPlayerHost =
    currentPlayer?.id === room?.hostPlayerId;
  
  const areAllPlayersReady =
    players.length >= 2 &&
    players.every((player) => player.isReady);
  
  const canStartGame =
    room?.status === "waiting" &&
    isCurrentPlayerHost &&
    areAllPlayersReady &&
    !isStartingGame;

  async function handleToggleReady() {
    if (!currentPlayer || isUpdatingReady) {
      return;
    }
  
    setIsUpdatingReady(true);
    setReadyError(null);
  
    const nextIsReady =
      !currentPlayer.isReady;
  
    try {
      await updateSkullKingPlayerReady(
        currentPlayer.id,
        nextIsReady,
      );
  
      setPlayers((currentPlayers) =>
        currentPlayers.map((player) =>
          player.id === currentPlayer.id
            ? {
                ...player,
                isReady: nextIsReady,
              }
            : player,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "준비 상태를 변경하지 못했습니다.";
  
      setReadyError(message);
    } finally {
      setIsUpdatingReady(false);
    }
  }

  async function handleStartGame() {
    if (
      !room ||
      !currentPlayer ||
      !isCurrentPlayerHost ||
      isStartingGame
    ) {
      return;
    }
  
    setIsStartingGame(true);
    setStartError(null);
  
    try {
      await startSkullKingGame(
        room.id,
        currentPlayer.id,
      );
  
      // polling을 기다리지 않고 방장은 바로 이동
      router.replace(
        `/games/skull-king/multi/${room.id}/play`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "게임을 시작하지 못했습니다.";
  
      setStartError(message);
      setIsStartingGame(false);
    }
  }
  
  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
      <Header title="스컬킹 대기실" />

      {errorMessage && (
        <p
          role="alert"
          className="mt-6 text-sm text-red-600"
        >
          {errorMessage}
        </p>
      )}

      {room && (
        <>
          <section className="mt-8 rounded-2xl border border-board-border bg-board-surface p-5">
            <p className="text-sm text-board-subtext">
              방 코드
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[0.2em] text-board-text">
              {room.code}
            </p>

            <p className="mt-4 text-sm text-board-subtext">
              참가 인원: {players.length} / 8
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-semibold text-board-text">
              참가자
            </h2>

            <ul className="mt-4 flex flex-col gap-3">
              {players.map((player) => {
                const isCurrentPlayer =
                  player.id === multiplayerSession?.playerId;
                
                const isHost = player.id === room.hostPlayerId;
            
                return (
                  <li
                    key={player.id}
                    className="flex items-center justify-between rounded-xl bg-board-secondary px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {player.name}
                      </span>
            
                      {isHost && (
                        <span className="rounded-full bg-board-primary-soft px-2 py-0.5 text-xs font-semibold text-board-primary">
                          방장
                        </span>
                      )}
            
                      {isCurrentPlayer && (
                        <span className="text-xs text-board-muted">
                          나
                        </span>
                      )}
                    </div>
            
                    <span
                      className={
                        player.isReady
                          ? "font-semibold text-board-primary"
                          : "text-board-muted"
                      }
                    >
                      {player.isReady
                        ? "준비 완료"
                        : "준비 안 됨"}
                    </span>
                  </li>
                );
              })}
            </ul>

            {currentPlayer && (
              <button
                type="button"
                onClick={handleToggleReady}
                disabled={isUpdatingReady}
                className={`mt-5 flex h-12 w-full items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary disabled:cursor-not-allowed disabled:opacity-60 ${
                  currentPlayer.isReady
                    ? "border border-board-primary bg-board-surface text-board-primary"
                    : "bg-board-primary text-white"
                }`}
              >
                {isUpdatingReady
                  ? "변경 중..."
                  : currentPlayer.isReady
                    ? "준비 취소"
                    : "준비"}
              </button>
            )}

            {readyError && (
              <p
                role="alert"
                className="mt-3 text-sm text-red-600"
              >
                {readyError}
              </p>
            )}

            {isCurrentPlayerHost && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-board-primary font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-primary disabled:cursor-not-allowed disabled:bg-board-disabled disabled:text-board-disabled-text"
                >
                  {isStartingGame
                    ? "게임 시작 중..."
                    : "게임 시작"}
                </button>
            
                {!areAllPlayersReady && (
                  <p className="mt-3 text-center text-sm text-board-subtext">
                    최소 2명이 참가하고 모두 준비해야 합니다.
                  </p>
                )}
            
                {startError && (
                  <p
                    role="alert"
                    className="mt-3 text-sm text-red-600"
                  >
                    {startError}
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}