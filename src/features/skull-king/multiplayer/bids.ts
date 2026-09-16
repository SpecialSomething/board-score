import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  runTransaction,
} from "firebase/firestore";

import { db } from "@/lib/firebase";



export interface SkullKingBid {
  id: string;
  room_id: string;
  player_id: string;
  round: number;
  bid: number;
  submitted_at: string;
  updated_at: string;
  is_ready: boolean;
}

interface SubmitBidParams {
  roomId: string;
  playerId: string;
  round: number;
  bid: number;
  isReady: boolean;
}

interface CheckAllBidsSubmittedParams {
  roomId: string;
  round: number;
  playerCount: number;
}

interface AdvanceToScoringParams {
  roomId: string;
  round: number;
  playerIds: string[];
}

/**
 * 특정 라운드의 예측 목록을 조회합니다.
 */
export async function getRoundBids(
  roomId: string,
  round: number,
): Promise<SkullKingBid[]> {
  if (!roomId) {
    throw new Error("방 ID가 필요합니다.");
  }

  try {
    const bidsSnapshot = await getDocs(
      collection(
        db,
        "rooms",
        roomId,
        "rounds",
        String(round),
        "bids",
      ),
    );

    const bids: SkullKingBid[] =
      bidsSnapshot.docs.map((bidDoc) => {
        const data = bidDoc.data();

        return {
          id: bidDoc.id,
          room_id: roomId,
          player_id: bidDoc.id,
          round,
          bid: data.bid,
          submitted_at:
            data.submittedAt
              ?.toDate()
              .toISOString() ?? null,
          updated_at:
            data.updatedAt
              ?.toDate()
              .toISOString() ?? null,
          is_ready: data.isReady,
        };
      });

    bids.sort((a, b) =>
      (a.submitted_at ?? "").localeCompare(
        b.submitted_at ?? "",
      ),
    );

    return bids;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `예측 목록을 불러오지 못했습니다: ${message}`,
    );
  }
}

/**
 * 플레이어의 예측을 제출합니다.
 *
 * 같은 방, 같은 라운드, 같은 플레이어의 행이 이미 있으면
 * 기존 예측을 수정합니다.
 */
export async function submitBid({
  roomId,
  playerId,
  round,
  bid,
  isReady,
}: SubmitBidParams): Promise<SkullKingBid> {
  validateBidInput({
    roomId,
    playerId,
    round,
    bid,
    isReady,
  });

  try {
    const roundRef = doc(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
    );

    const bidRef = doc(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
      "bids",
      playerId,
    );

    const existingBidSnapshot =
      await getDoc(bidRef);

    const now = new Date().toISOString();

    const submittedAt =
      existingBidSnapshot.exists()
        ? existingBidSnapshot.data().submittedAt
        : serverTimestamp();

    const roundSnapshot = await getDoc(roundRef);

    if (!roundSnapshot.exists()) {
      await setDoc(roundRef, {
        round,
      });
    }
    
    await setDoc(
      bidRef,
      {
        bid,
        isReady,
        submittedAt,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    return {
      id: playerId,
      room_id: roomId,
      player_id: playerId,
      round,
      bid,
      submitted_at: now,
      updated_at: now,
      is_ready: isReady,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `예측을 제출하지 못했습니다: ${message}`,
    );
  }
}

/**
 * 특정 플레이어가 현재 라운드에 제출한 예측을 조회합니다.
 *
 * 제출하지 않았다면 null을 반환합니다.
 */
export async function getPlayerBid(
  roomId: string,
  playerId: string,
  round: number,
): Promise<SkullKingBid | null> {
  try {
    const bidRef = doc(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
      "bids",
      playerId,
    );

    const bidSnapshot = await getDoc(bidRef);

    if (!bidSnapshot.exists()) {
      return null;
    }

    const data = bidSnapshot.data();

    return {
      id: bidSnapshot.id,
      room_id: roomId,
      player_id: playerId,
      round,
      bid: data.bid,
      submitted_at:
        data.submittedAt?.toDate().toISOString() ?? null,
      updated_at:
        data.updatedAt?.toDate().toISOString() ?? null,
      is_ready: data.isReady,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `플레이어의 예측을 불러오지 못했습니다: ${message}`,
    );
  }
}

/**
 * 현재 라운드에 모든 플레이어가 예측을 제출했는지 확인합니다.
 */
export async function haveAllPlayersSubmittedBids({
  roomId,
  round,
  playerCount,
}: CheckAllBidsSubmittedParams): Promise<boolean> {
  if (playerCount < 1) {
    return false;
  }

  try {
    const bidsSnapshot = await getDocs(
      collection(
        db,
        "rooms",
        roomId,
        "rounds",
        String(round),
        "bids",
      ),
    );

    return bidsSnapshot.size === playerCount;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `예측 제출 현황을 확인하지 못했습니다: ${message}`,
    );
  }
}

/**
 * 모든 플레이어가 현재 라운드의 예측을 제출했다면
 * 방 상태를 bidding에서 scoring으로 변경합니다.
 *
 * 실제로 상태가 변경되면 true,
 * 아직 모두 제출하지 않았거나 이미 상태가 바뀌었다면 false를 반환합니다.
 */
export async function advanceRoomToScoringIfReady({
  roomId,
  round,
  playerIds,
}: AdvanceToScoringParams): Promise<boolean> {
  const roomRef = doc(
    db,
    "rooms",
    roomId,
  );

  const bidRefs = playerIds.map((playerId) =>
    doc(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
      "bids",
      playerId,
    ),
  );

  try {
    return await runTransaction(
      db,
      async (transaction) => {
        const roomSnapshot =
          await transaction.get(roomRef);

        if (!roomSnapshot.exists()) {
          return false;
        }

        const room = roomSnapshot.data();

        if (
          room.currentRound !== round ||
          room.status !== "bidding"
        ) {
          return false;
        }

        const bidSnapshots =
          await Promise.all(
            bidRefs.map((bidRef) =>
              transaction.get(bidRef),
            ),
          );

        const allPlayersReady =
          bidSnapshots.length === playerIds.length &&
          bidSnapshots.every(
            (bidSnapshot) =>
              bidSnapshot.exists() &&
              bidSnapshot.data().isReady === true,
          );

        if (!allPlayersReady) {
          return false;
        }

        transaction.update(roomRef, {
          status: "scoring",
          updatedAt: serverTimestamp(),
        });

        return true;
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `결과 입력 단계로 전환하지 못했습니다: ${message}`,
    );
  }
}

function validateBidInput({
  roomId,
  playerId,
  round,
  bid,
}: SubmitBidParams): void {
  if (!roomId) {
    throw new Error("방 ID가 필요합니다.");
  }

  if (!playerId) {
    throw new Error("플레이어 ID가 필요합니다.");
  }

  if (!Number.isInteger(round) || round < 1 || round > 10) {
    throw new Error(
      "라운드는 1 이상 10 이하의 정수여야 합니다.",
    );
  }

  if (!Number.isInteger(bid) || bid < 0 || bid > round) {
    throw new Error(
      `예측 수는 0 이상 ${round} 이하여야 합니다.`,
    );
  }
}

export async function getRoomBids(
  roomId: string,
): Promise<SkullKingBid[]> {
  if (!roomId) {
    throw new Error("방 ID가 필요합니다.");
  }

  try {
    const roundsSnapshot = await getDocs(
      collection(
        db,
        "rooms",
        roomId,
        "rounds",
      ),
    );

    const bids: SkullKingBid[] = [];

    for (const roundDoc of roundsSnapshot.docs) {
      const round = Number(roundDoc.id);

      const bidsSnapshot = await getDocs(
        collection(
          db,
          "rooms",
          roomId,
          "rounds",
          roundDoc.id,
          "bids",
        ),
      );

      for (const bidDoc of bidsSnapshot.docs) {
        const data = bidDoc.data();

        bids.push({
          id: bidDoc.id,
          room_id: roomId,
          player_id: bidDoc.id,
          round,
          bid: data.bid,
          is_ready: data.isReady,
          submitted_at:
            data.submittedAt
              ?.toDate()
              .toISOString() ?? null,
          updated_at:
            data.updatedAt
              ?.toDate()
              .toISOString() ?? null,
        });
      }
    }

    bids.sort((a, b) => a.round - b.round);

    return bids;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `전체 예측 정보를 불러오지 못했습니다: ${message}`,
    );
  }
}

type UpdateBidReadyParams = {
  roomId: string;
  playerId: string;
  round: number;
  isReady: boolean;
};

export async function updateBidReady({
  roomId,
  playerId,
  round,
  isReady,
}: UpdateBidReadyParams): Promise<void> {
  const roomRef = doc(
    db,
    "rooms",
    roomId,
  );

  const bidRef = doc(
    db,
    "rooms",
    roomId,
    "rounds",
    String(round),
    "bids",
    playerId,
  );

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

        if (
          room.status !== "bidding" ||
          room.currentRound !== round
        ) {
          throw new Error("ROUND_ALREADY_STARTED");
        }

        const bidSnapshot =
          await transaction.get(bidRef);

        if (!bidSnapshot.exists()) {
          throw new Error("BID_NOT_FOUND");
        }

        transaction.update(bidRef, {
          isReady,
          updatedAt: serverTimestamp(),
        });
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
      error.message === "BID_NOT_FOUND"
    ) {
      throw new Error(
        "제출한 예측을 찾을 수 없습니다.",
      );
    }

    if (
      error instanceof Error &&
      error.message === "ROUND_ALREADY_STARTED"
    ) {
      throw new Error(
        "이미 결과 입력이 시작되어 예측 완료 상태를 변경할 수 없습니다.",
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `예측 준비 상태를 변경하지 못했습니다: ${message}`,
    );
  }
}