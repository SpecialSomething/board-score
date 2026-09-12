import { ensureAnonymousUser } from "./auth";
import { 
    createRoomCode,
    normalizeRoomCode,
} from "./room-code";

import { SkullKingRoom, SkullKingRoomPlayer } from "./types";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  runTransaction,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

type CreateRoomResult = {
  roomId: string;
  roomCode: string;
  playerId: string;
};

const MAX_ROOM_CODE_ATTEMPTS = 5;

export async function createSkullKingRoom(
  playerName: string,
): Promise<CreateRoomResult> {
  const trimmedName = playerName.trim();

  if (!trimmedName) {
    throw new Error("이름을 입력해주세요.");
  }

  if (trimmedName.length > 12) {
    throw new Error("이름은 12자 이하로 입력해주세요.");
  }

  const user = await ensureAnonymousUser();

  for (
    let attempt = 0;
    attempt < MAX_ROOM_CODE_ATTEMPTS;
    attempt += 1
  ) {
    const roomCode = createRoomCode();

    const roomRef = doc(collection(db, "rooms"));
    const playerRef = doc(collection(roomRef, "players"));
    const roomCodeRef = doc(db, "roomCodes", roomCode);

    try {
      await runTransaction(db, async (transaction) => {
        const roomCodeSnapshot =
          await transaction.get(roomCodeRef);

        if (roomCodeSnapshot.exists()) {
          throw new Error("ROOM_CODE_COLLISION");
        }

        transaction.set(roomRef, {
          gameType: "skull-king",
          code: roomCode,
          createdByUserId: user.uid,
          hostPlayerId: playerRef.id,
          status: "waiting",
          currentRound: 1,

          playerCount: 1,
          usedSeats: [1],

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.set(playerRef, {
          userId: user.uid,
          name: trimmedName,
          seat: 1,
          isReady: true,
          joinedAt: serverTimestamp(),
        });

        transaction.set(roomCodeRef, {
          roomId: roomRef.id,
          gameType: "skull-king",
          createdAt: serverTimestamp(),
        });
      });

      return {
        roomId: roomRef.id,
        roomCode,
        playerId: playerRef.id,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "ROOM_CODE_COLLISION"
      ) {
        continue;
      }

      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류";

      throw new Error(`방 생성에 실패했습니다: ${message}`);
    }
  }

  throw new Error(
    "사용 가능한 방 코드를 생성하지 못했습니다. 다시 시도해주세요.",
  );
}

type JoinRoomResult = {
  roomId: string;
  roomCode: string;
  playerId: string;
  playerName: string;
};

export async function joinSkullKingRoom(
  roomCode: string,
  playerName: string,
): Promise<JoinRoomResult> {
  const normalizedCode =
    normalizeRoomCode(roomCode);

  const trimmedName = playerName.trim();

  if (normalizedCode.length !== 6) {
    throw new Error(
      "방 코드는 6자리로 입력해주세요.",
    );
  }

  if (!trimmedName) {
    throw new Error("이름을 입력해주세요.");
  }

  if (trimmedName.length > 12) {
    throw new Error(
      "이름은 12자 이하로 입력해주세요.",
    );
  }

  const user = await ensureAnonymousUser();

  const roomCodeRef = doc(
    db,
    "roomCodes",
    normalizedCode,
  );

  const roomCodeSnapshot =
    await getDoc(roomCodeRef);

  if (!roomCodeSnapshot.exists()) {
    throw new Error(
      "존재하지 않는 방 코드입니다.",
    );
  }

  const roomId =
    roomCodeSnapshot.data().roomId as string;

  const roomRef = doc(
    db,
    "rooms",
    roomId,
  );

  const playersRef = collection(
    roomRef,
    "players",
  );

  /*
   * 같은 브라우저에서 이미 참가한 방이라면
   * 새로운 player를 만들지 않고 기존 player를 반환합니다.
   */
  const existingPlayerQuery = query(
    playersRef,
    where("userId", "==", user.uid),
  );

  const existingPlayerSnapshot =
    await getDocs(existingPlayerQuery);

  if (!existingPlayerSnapshot.empty) {
    const existingPlayer =
      existingPlayerSnapshot.docs[0];

    return {
      roomId,
      roomCode: normalizedCode,
      playerId: existingPlayer.id,
      playerName:
        existingPlayer.data().name as string,
    };
  }

  const playerRef = doc(playersRef);

  try {
    await runTransaction(
      db,
      async (transaction) => {
        const roomSnapshot =
          await transaction.get(roomRef);

        if (!roomSnapshot.exists()) {
          throw new Error("ROOM_NOT_FOUND");
        }

        const room = roomSnapshot.data();

        if (room.status !== "waiting") {
          throw new Error(
            "ROOM_ALREADY_STARTED",
          );
        }

        const playerCount =
          room.playerCount as number;

        const usedSeats =
          room.usedSeats as number[];

        if (playerCount >= 8) {
          throw new Error("ROOM_FULL");
        }

        let nextSeat = 1;

        while (usedSeats.includes(nextSeat)) {
          nextSeat += 1;
        }

        transaction.set(playerRef, {
          userId: user.uid,
          name: trimmedName,
          seat: nextSeat,
          isReady: false,
          joinedAt: serverTimestamp(),
        });

        transaction.update(roomRef, {
          playerCount: playerCount + 1,
          usedSeats: [...usedSeats, nextSeat],
          updatedAt: serverTimestamp(),
        });
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ROOM_NOT_FOUND") {
        throw new Error(
          "존재하지 않는 방입니다.",
        );
      }

      if (
        error.message ===
        "ROOM_ALREADY_STARTED"
      ) {
        throw new Error(
          "이미 게임이 시작된 방입니다.",
        );
      }

      if (error.message === "ROOM_FULL") {
        throw new Error(
          "참가 인원이 가득 찬 방입니다.",
        );
      }

      throw new Error(
        `방 참가에 실패했습니다: ${error.message}`,
      );
    }

    throw new Error(
      "방 참가 중 알 수 없는 오류가 발생했습니다.",
    );
  }

  return {
    roomId,
    roomCode: normalizedCode,
    playerId: playerRef.id,
    playerName: trimmedName,
  };
}

export async function getSkullKingRoom(
  roomId: string,
): Promise<SkullKingRoom> {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    throw new Error(
      "방 정보를 불러오지 못했습니다: 존재하지 않는 방입니다.",
    );
  }

  const data = roomSnapshot.data();

  return {
    id: roomSnapshot.id,
    code: data.code,
    hostPlayerId: data.hostPlayerId,
    status: data.status,
    currentRound: data.currentRound,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

export async function getSkullKingRoomPlayers(
  roomId: string,
): Promise<SkullKingRoomPlayer[]> {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    throw new Error(
      "방 정보를 불러오지 못했습니다: 존재하지 않는 방입니다.",
    );
  }

  const roomData = roomSnapshot.data();

  const playersRef = collection(
    db,
    "rooms",
    roomId,
    "players",
  );

  const playersQuery = query(
    playersRef,
    orderBy("seat", "asc"),
  );

  const playersSnapshot = await getDocs(playersQuery);

  return playersSnapshot.docs.map((playerDoc) => {
    const player = playerDoc.data();

    return {
      id: playerDoc.id,
      roomId,
      name: player.name,
      seat: player.seat,
      isHost:
        playerDoc.id === roomData.hostPlayerId,
      isReady: player.isReady,
      joinedAt:
        player.joinedAt.toDate().toISOString(),
    };
  });
}

export async function updateSkullKingPlayerReady(
  roomId: string,
  playerId: string,
  isReady: boolean,
): Promise<void> {
  const playerRef = doc(
    db,
    "rooms",
    roomId,
    "players",
    playerId,
  );

  try {
    await runTransaction(
      db,
      async (transaction) => {
        const playerSnapshot =
          await transaction.get(playerRef);

        if (!playerSnapshot.exists()) {
          throw new Error("PLAYER_NOT_FOUND");
        }

        transaction.update(playerRef, {
          isReady,
        });
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PLAYER_NOT_FOUND"
    ) {
      throw new Error(
        "참가자 정보를 찾을 수 없습니다.",
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `준비 상태를 변경하지 못했습니다: ${message}`,
    );
  }
}

export async function startSkullKingGame(
  roomId: string,
  hostPlayerId: string,
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  const playersRef = collection(
    db,
    "rooms",
    roomId,
    "players",
  );

  const playersSnapshot = await getDocs(playersRef);

  try {
    await runTransaction(
      db,
      async (transaction) => {
        const roomSnapshot =
          await transaction.get(roomRef);

        if (!roomSnapshot.exists()) {
          throw new Error("ROOM_NOT_FOUND");
        }

        const room = roomSnapshot.data();

        if (room.hostPlayerId !== hostPlayerId) {
          throw new Error("NOT_HOST");
        }

        if (room.status !== "waiting") {
          throw new Error("ROOM_ALREADY_STARTED");
        }

        if (playersSnapshot.size < 2) {
          throw new Error("NOT_ENOUGH_PLAYERS");
        }

        const allGuestsReady =
          playersSnapshot.docs
            .filter(
              (playerDoc) =>
                playerDoc.id !== hostPlayerId,
            )
            .every(
              (playerDoc) =>
                playerDoc.data().isReady === true,
            );

        if (!allGuestsReady) {
          throw new Error("PLAYERS_NOT_READY");
        }

        transaction.update(roomRef, {
          status: "bidding",
          currentRound: 1,
          updatedAt: serverTimestamp(),
        });
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ROOM_NOT_FOUND") {
        throw new Error(
          "방 정보를 찾을 수 없습니다.",
        );
      }

      if (error.message === "NOT_HOST") {
        throw new Error(
          "방장만 게임을 시작할 수 있습니다.",
        );
      }

      if (
        error.message === "ROOM_ALREADY_STARTED"
      ) {
        throw new Error(
          "이미 게임이 시작되었습니다.",
        );
      }

      if (
        error.message === "NOT_ENOUGH_PLAYERS"
      ) {
        throw new Error(
          "게임을 시작하려면 최소 2명이 필요합니다.",
        );
      }

      if (
        error.message === "PLAYERS_NOT_READY"
      ) {
        throw new Error(
          "모든 참가자가 준비해야 게임을 시작할 수 있습니다.",
        );
      }

      throw new Error(
        `게임을 시작하지 못했습니다: ${error.message}`,
      );
    }

    throw new Error(
      "게임 시작 중 알 수 없는 오류가 발생했습니다.",
    );
  }
}

type AdvanceSkullKingRoomParams = {
  roomId: string;
  hostPlayerId: string;
  currentRound: number;
};

export async function advanceSkullKingRoom({
  roomId,
  hostPlayerId,
  currentRound,
}: AdvanceSkullKingRoomParams): Promise<SkullKingRoom> {
  const isLastRound = currentRound >= 10;
  const roomRef = doc(db, "rooms", roomId);

  try {
    return await runTransaction(
      db,
      async (transaction) => {
        const roomSnapshot =
          await transaction.get(roomRef);

        if (!roomSnapshot.exists()) {
          throw new Error("ROOM_NOT_FOUND");
        }

        const room = roomSnapshot.data();

        if (room.hostPlayerId !== hostPlayerId) {
          throw new Error("NOT_HOST");
        }

        if (room.status !== "round-result") {
          throw new Error("STATUS_CHANGED");
        }

        if (room.currentRound !== currentRound) {
          throw new Error("ROUND_CHANGED");
        }

        const nextStatus = isLastRound
          ? "finished"
          : "bidding";

        const nextRound = isLastRound
          ? currentRound
          : currentRound + 1;

        transaction.update(roomRef, {
          status: nextStatus,
          currentRound: nextRound,
          updatedAt: serverTimestamp(),
        });

        const now = new Date().toISOString();

        return {
          id: roomSnapshot.id,
          code: room.code,
          hostPlayerId: room.hostPlayerId,
          status: nextStatus,
          currentRound: nextRound,
          createdAt:
            room.createdAt
              ?.toDate()
              .toISOString() ?? now,
          updatedAt: now,
        };
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ROOM_NOT_FOUND"
    ) {
      throw new Error("방 정보를 찾을 수 없습니다.");
    }

    if (
      error instanceof Error &&
      error.message === "NOT_HOST"
    ) {
      throw new Error(
        "방장만 다음 라운드로 진행할 수 있습니다.",
      );
    }

    if (
      error instanceof Error &&
      error.message === "STATUS_CHANGED"
    ) {
      throw new Error(
        "현재 라운드 결과 상태가 아닙니다.",
      );
    }

    if (
      error instanceof Error &&
      error.message === "ROUND_CHANGED"
    ) {
      throw new Error(
        "현재 라운드가 이미 변경되었습니다.",
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      isLastRound
        ? `게임을 종료하지 못했습니다: ${message}`
        : `다음 라운드로 넘어가지 못했습니다: ${message}`,
    );
  }
}

type UpdateSkullKingRoomStatusParams = {
  roomId: string;
  hostPlayerId: string;
  fromStatus: SkullKingRoom["status"];
  toStatus: SkullKingRoom["status"];
};

export async function updateSkullKingRoomStatus({
  roomId,
  hostPlayerId,
  fromStatus,
  toStatus,
}: UpdateSkullKingRoomStatusParams): Promise<SkullKingRoom> {
  const roomRef = doc(db, "rooms", roomId);

  try {
    return await runTransaction(
      db,
      async (transaction) => {
        const roomSnapshot =
          await transaction.get(roomRef);

        if (!roomSnapshot.exists()) {
          throw new Error("ROOM_NOT_FOUND");
        }

        const room = roomSnapshot.data();

        if (room.hostPlayerId !== hostPlayerId) {
          throw new Error("NOT_HOST");
        }

        if (room.status !== fromStatus) {
          throw new Error("STATUS_CHANGED");
        }

        transaction.update(roomRef, {
          status: toStatus,
          updatedAt: serverTimestamp(),
        });

        const now = new Date().toISOString();

        return {
          id: roomSnapshot.id,
          code: room.code,
          hostPlayerId: room.hostPlayerId,
          status: toStatus,
          currentRound: room.currentRound,
          createdAt:
            room.createdAt
              ?.toDate()
              .toISOString() ?? now,
          updatedAt: now,
        };
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ROOM_NOT_FOUND"
    ) {
      throw new Error(
        "방 정보를 찾을 수 없습니다.",
      );
    }

    if (
      error instanceof Error &&
      error.message === "NOT_HOST"
    ) {
      throw new Error(
        "방장만 방 상태를 변경할 수 있습니다.",
      );
    }

    if (
      error instanceof Error &&
      error.message === "STATUS_CHANGED"
    ) {
      throw new Error(
        "방 상태가 이미 변경되었습니다.",
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `방 상태를 변경하지 못했습니다: ${message}`,
    );
  }
}

type ResetSkullKingRoomForRematchParams = {
  roomId: string;
};

export async function resetSkullKingRoomForRematch({
  roomId,
}: ResetSkullKingRoomForRematchParams): Promise<void> {
  if (!roomId) {
    throw new Error("방 ID가 필요합니다.");
  }

  try {
    await ensureAnonymousUser();

    const functions = getFunctions(
      undefined,
      "asia-northeast3",
    );

    const resetRoom = httpsCallable<
      { roomId: string },
      { success: boolean }
    >(
      functions,
      "resetSkullKingRoomForRematch",
    );

    await resetRoom({
      roomId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `새 게임을 준비하지 못했습니다: ${message}`,
    );
  }
}