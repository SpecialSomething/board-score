import {setGlobalOptions} from "firebase-functions";
import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import {
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

initializeApp();

setGlobalOptions({
  maxInstances: 10,
  region: "asia-northeast3",
});

export const resetSkullKingRoomForRematch = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "로그인이 필요합니다.",
      );
    }

    const roomId = request.data?.roomId;

    if (
      typeof roomId !== "string" ||
      roomId.length === 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "방 ID가 필요합니다.",
      );
    }

    const db = getFirestore();

    const roomRef = db
      .collection("rooms")
      .doc(roomId);

    const roomSnapshot = await roomRef.get();

    if (!roomSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "종료된 방을 찾을 수 없습니다.",
      );
    }

    const room = roomSnapshot.data();

    if (
      !room ||
      room.status !== "finished"
    ) {
      throw new HttpsError(
        "failed-precondition",
        "종료된 방을 찾을 수 없습니다.",
      );
    }

    const hostPlayerId = room.hostPlayerId;

    if (
      typeof hostPlayerId !== "string" ||
      hostPlayerId.length === 0
    ) {
      throw new HttpsError(
        "failed-precondition",
        "방장 정보를 찾을 수 없습니다.",
      );
    }

    const hostPlayerRef = roomRef
      .collection("players")
      .doc(hostPlayerId);

    const hostPlayerSnapshot =
      await hostPlayerRef.get();

    if (
      !hostPlayerSnapshot.exists ||
      hostPlayerSnapshot.data()?.userId !==
        request.auth.uid
    ) {
      throw new HttpsError(
        "permission-denied",
        "방장만 한 판 더 시작할 수 있습니다.",
      );
    }

    /*
     * 이전 게임의 모든 rounds와
     * 하위 컬렉션을 재귀적으로 삭제합니다.
     *
     * Admin SDK에서 recursiveDelete를 사용하므로
     * bids / submissions / lootAlliances도
     * 함께 삭제됩니다.
     */
    const roundsRef =
      roomRef.collection("rounds");

    await db.recursiveDelete(roundsRef);

    /*
     * 모든 참가자를 준비 안 됨으로 초기화하고
     * 방장만 준비 완료 상태로 둡니다.
     */
    const playersSnapshot =
      await roomRef
        .collection("players")
        .get();

    const batch = db.batch();

    for (const playerDoc of
      playersSnapshot.docs) {
      batch.update(playerDoc.ref, {
        isReady:
          playerDoc.id === hostPlayerId,
      });
    }

    batch.update(roomRef, {
      status: "waiting",
      currentRound: 1,
      updatedAt: Timestamp.now(),
    });

    await batch.commit();

    return {
      success: true,
    };
  },
);