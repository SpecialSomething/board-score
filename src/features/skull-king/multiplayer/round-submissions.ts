import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  runTransaction,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  SkullKingRoundSubmission,
} from "./types";

import {
  MAX_MERMAIDS_CAPTURED_BY_PIRATE,
  MAX_PIRATES_CAPTURED_BY_SKULL_KING,
  MAX_STANDARD_FOURTEENS,
} from "../constants";

type SubmitRoundSubmissionParams = {
  roomId: string;
  playerId: string;
  round: number;

  tricks: number;
  standardFourteensCount: number;
  blackFourteenCaptured: boolean;
  mermaidsCapturedByPirate: number;
  piratesCapturedBySkullKing: number;
  skullKingCapturedByMermaid: boolean;

  isReady: boolean;
};

type CheckAllRoundSubmissionsParams = {
  roomId: string;
  round: number;
  playerCount: number;
};

/**
 * 특정 라운드에 제출된 모든 플레이어의 결과를 조회합니다.
 */
export async function getRoundSubmissions(
  roomId: string,
  round: number,
): Promise<SkullKingRoundSubmission[]> {
  validateRoomAndRound(roomId, round);

  try {
    const submissionsSnapshot = await getDocs(
      collection(
        db,
        "rooms",
        roomId,
        "rounds",
        String(round),
        "submissions",
      ),
    );

    const submissions: SkullKingRoundSubmission[] =
      submissionsSnapshot.docs.map((submissionDoc) => {
        const data = submissionDoc.data();

        return {
          id: submissionDoc.id,
          roomId,
          playerId: submissionDoc.id,
          round,
          tricks: data.tricks,
          standardFourteensCount:
            data.standardFourteensCount,
          blackFourteenCaptured:
            data.blackFourteenCaptured,
          mermaidsCapturedByPirate:
            data.mermaidsCapturedByPirate,
          piratesCapturedBySkullKing:
            data.piratesCapturedBySkullKing,
          skullKingCapturedByMermaid:
            data.skullKingCapturedByMermaid,
          isReady: data.isReady,
          submittedAt:
            data.submittedAt?.toDate().toISOString() ??
            null,
          updatedAt:
            data.updatedAt?.toDate().toISOString() ??
            null,
        };
      });

    submissions.sort((a, b) =>
      (a.submittedAt ?? "").localeCompare(
        b.submittedAt ?? "",
      ),
    );

    return submissions;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `라운드 결과를 불러오지 못했습니다: ${message}`,
    );
  }
}

/**
 * 특정 플레이어가 현재 라운드에 제출한 결과를 조회합니다.
 *
 * 아직 제출하지 않았다면 null을 반환합니다.
 */
export async function getPlayerRoundSubmission(
  roomId: string,
  playerId: string,
  round: number,
): Promise<SkullKingRoundSubmission | null> {
  validateRoomAndRound(roomId, round);

  if (!playerId) {
    throw new Error("플레이어 ID가 필요합니다.");
  }

  try {
    const submissionRef = doc(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
      "submissions",
      playerId,
    );

    const submissionSnapshot =
      await getDoc(submissionRef);

    if (!submissionSnapshot.exists()) {
      return null;
    }

    const data = submissionSnapshot.data();

    return {
      id: submissionSnapshot.id,
      roomId,
      playerId,
      round,
      tricks: data.tricks,
      standardFourteensCount:
        data.standardFourteensCount,
      blackFourteenCaptured:
        data.blackFourteenCaptured,
      mermaidsCapturedByPirate:
        data.mermaidsCapturedByPirate,
      piratesCapturedBySkullKing:
        data.piratesCapturedBySkullKing,
      skullKingCapturedByMermaid:
        data.skullKingCapturedByMermaid,
      isReady: data.isReady,
      submittedAt:
        data.submittedAt?.toDate().toISOString() ??
        null,
      updatedAt:
        data.updatedAt?.toDate().toISOString() ??
        null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `내 라운드 결과를 불러오지 못했습니다: ${message}`,
    );
  }
}

/**
 * 플레이어의 라운드 결과를 제출합니다.
 *
 * 같은 방, 같은 라운드, 같은 플레이어의 결과가 이미 있다면
 * 기존 결과를 수정합니다.
 */
export async function submitRoundSubmission({
  roomId,
  playerId,
  round,
  tricks,
  standardFourteensCount,
  blackFourteenCaptured,
  mermaidsCapturedByPirate,
  piratesCapturedBySkullKing,
  skullKingCapturedByMermaid,
  isReady,
}: SubmitRoundSubmissionParams): Promise<SkullKingRoundSubmission> {
  validateRoundSubmission({
    roomId,
    playerId,
    round,
    tricks,
    standardFourteensCount,
    blackFourteenCaptured,
    mermaidsCapturedByPirate,
    piratesCapturedBySkullKing,
    skullKingCapturedByMermaid,
    isReady,
  });

  try {
    const submissionRef = doc(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
      "submissions",
      playerId,
    );

    const existingSubmissionSnapshot =
      await getDoc(submissionRef);

    const submittedAt =
      existingSubmissionSnapshot.exists()
        ? existingSubmissionSnapshot.data().submittedAt
        : serverTimestamp();

    await setDoc(
      submissionRef,
      {
        tricks,
        standardFourteensCount,
        blackFourteenCaptured,
        mermaidsCapturedByPirate,
        piratesCapturedBySkullKing,
        skullKingCapturedByMermaid,
        isReady,
        submittedAt,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    const now = new Date().toISOString();

    return {
      id: playerId,
      roomId,
      playerId,
      round,
      tricks,
      standardFourteensCount,
      blackFourteenCaptured,
      mermaidsCapturedByPirate,
      piratesCapturedBySkullKing,
      skullKingCapturedByMermaid,
      isReady,
      submittedAt:
        existingSubmissionSnapshot.exists()
          ? existingSubmissionSnapshot
              .data()
              .submittedAt?.toDate()
              .toISOString() ?? now
          : now,
      updatedAt: now,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `라운드 결과를 제출하지 못했습니다: ${message}`,
    );
  }
}

type UpdateRoundReadyParams = {
    roomId: string;
    playerId: string;
    round: number;
    isReady: boolean;
  };
  
export async function updateRoundReady({
  roomId,
  playerId,
  round,
  isReady,
}: UpdateRoundReadyParams): Promise<SkullKingRoundSubmission> {
  validateRoomAndRound(roomId, round);

  if (!playerId) {
    throw new Error("플레이어 ID가 필요합니다.");
  }

  try {
    const roomRef = doc(
      db,
      "rooms",
      roomId,
    );
    
    const submissionRef = doc(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
      "submissions",
      playerId,
    );
    
    const submissionSnapshot =
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
            room.status !== "scoring" ||
            room.currentRound !== round
          ) {
            throw new Error("ROUND_ALREADY_FINALIZED");
          }
    
          const currentSubmissionSnapshot =
            await transaction.get(submissionRef);
    
          if (!currentSubmissionSnapshot.exists()) {
            throw new Error("SUBMISSION_NOT_FOUND");
          }
    
          transaction.update(submissionRef, {
            isReady,
            updatedAt: serverTimestamp(),
          });
    
          return currentSubmissionSnapshot;
        },
      );
    
    const data = submissionSnapshot.data();

    return {
      id: submissionSnapshot.id,
      roomId,
      playerId,
      round,
      tricks: data.tricks,
      standardFourteensCount:
        data.standardFourteensCount,
      blackFourteenCaptured:
        data.blackFourteenCaptured,
      mermaidsCapturedByPirate:
        data.mermaidsCapturedByPirate,
      piratesCapturedBySkullKing:
        data.piratesCapturedBySkullKing,
      skullKingCapturedByMermaid:
        data.skullKingCapturedByMermaid,
      isReady: data.isReady,
      submittedAt:
        data.submittedAt?.toDate().toISOString() ??
        null,
      updatedAt:
        data.updatedAt?.toDate().toISOString() ??
        null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    if (
      error instanceof Error &&
      error.message === "ROOM_NOT_FOUND"
    ) {
      throw new Error("방 정보를 찾을 수 없습니다.");
    }
    
    if (
      error instanceof Error &&
      error.message === "SUBMISSION_NOT_FOUND"
    ) {
      throw new Error("라운드 결과를 찾을 수 없습니다.");
    }
    
    if (
      error instanceof Error &&
      error.message === "ROUND_ALREADY_FINALIZED"
    ) {
      throw new Error(
        "이미 라운드 결과가 확정되어 제출 상태를 변경할 수 없습니다.",
      );
    }

    throw new Error(
      `준비 상태를 변경하지 못했습니다: ${message}`,
    );
  }
}

/**
 * 현재 라운드에 모든 플레이어가 결과를 제출했는지 확인합니다.
 */
export async function haveAllPlayersReady({
  roomId,
  round,
  playerCount,
}: CheckAllRoundSubmissionsParams): Promise<boolean> {
  validateRoomAndRound(roomId, round);

  if (
    !Number.isInteger(playerCount) ||
    playerCount < 1
  ) {
    return false;
  }

  try {
    const submissionsSnapshot = await getDocs(
      collection(
        db,
        "rooms",
        roomId,
        "rounds",
        String(round),
        "submissions",
      ),
    );

    const readyCount =
      submissionsSnapshot.docs.filter(
        (submissionDoc) =>
          submissionDoc.data().isReady === true,
      ).length;

    return readyCount === playerCount;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `결과 제출 현황을 확인하지 못했습니다: ${message}`,
    );
  }
}

function validateRoomAndRound(
  roomId: string,
  round: number,
): void {
  if (!roomId) {
    throw new Error("방 ID가 필요합니다.");
  }

  if (
    !Number.isInteger(round) ||
    round < 1 ||
    round > 10
  ) {
    throw new Error(
      "라운드는 1 이상 10 이하의 정수여야 합니다.",
    );
  }
}

function validateRoundSubmission({
  roomId,
  playerId,
  round,
  tricks,
  standardFourteensCount,
  mermaidsCapturedByPirate,
  piratesCapturedBySkullKing,
}: SubmitRoundSubmissionParams): void {
  validateRoomAndRound(roomId, round);

  if (!playerId) {
    throw new Error("플레이어 ID가 필요합니다.");
  }

  validateCount(
    tricks,
    "획득 트릭 수",
    round,
  );

  validateCount(
    standardFourteensCount,
    "일반 14 보너스 수",
    MAX_STANDARD_FOURTEENS,
  );

  validateCount(
    mermaidsCapturedByPirate,
    "해적이 잡은 인어 수",
    MAX_MERMAIDS_CAPTURED_BY_PIRATE,
  );

  validateCount(
    piratesCapturedBySkullKing,
    "스컬 킹이 잡은 해적 수",
    MAX_PIRATES_CAPTURED_BY_SKULL_KING,
  );
}

function validateCount(
  value: number,
  label: string,
  max: number,
): void {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > max
  ) {
    throw new Error(
      `${label}는 0 이상 ${max} 이하의 정수여야 합니다.`,
    );
  }
}

export async function getRoomSubmissions(
  roomId: string,
): Promise<SkullKingRoundSubmission[]> {
  if (!roomId) {
    throw new Error("방 ID가 필요합니다.");
  }

  try {
    const roundsRef = collection(
      db,
      "rooms",
      roomId,
      "rounds",
    );

    const roundsQuery = query(
      roundsRef,
      orderBy("round", "asc"),
    );

    const roundsSnapshot =
      await getDocs(roundsQuery);

    const submissions: SkullKingRoundSubmission[] =
      [];

    for (const roundDoc of roundsSnapshot.docs) {
      const round = Number(roundDoc.id);

      const submissionsRef = collection(
        db,
        "rooms",
        roomId,
        "rounds",
        roundDoc.id,
        "submissions",
      );

      const submissionsSnapshot =
        await getDocs(submissionsRef);

      for (const submissionDoc of
        submissionsSnapshot.docs) {
        const data = submissionDoc.data();

        submissions.push({
          id: submissionDoc.id,
          roomId,
          playerId: submissionDoc.id,
          round,
          tricks: data.tricks,
          standardFourteensCount:
            data.standardFourteensCount,
          blackFourteenCaptured:
            data.blackFourteenCaptured,
          mermaidsCapturedByPirate:
            data.mermaidsCapturedByPirate,
          piratesCapturedBySkullKing:
            data.piratesCapturedBySkullKing,
          skullKingCapturedByMermaid:
            data.skullKingCapturedByMermaid,
          isReady: data.isReady,
          submittedAt:
            data.submittedAt
              ?.toDate()
              .toISOString() ?? null,
          updatedAt:
            data.updatedAt
              ?.toDate()
              .toISOString() ?? null,
        });
      }
    }

    return submissions;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `전체 라운드 결과를 불러오지 못했습니다: ${message}`,
    );
  }
}