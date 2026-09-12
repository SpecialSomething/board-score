import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  SkullKingRoomLootAlliance,
} from "@/features/skull-king/multiplayer/types";

export async function getRoundLootAlliances(
  roomId: string,
  round: number,
): Promise<SkullKingRoomLootAlliance[]> {
  try {
    const alliancesSnapshot = await getDocs(
      collection(
        db,
        "rooms",
        roomId,
        "rounds",
        String(round),
        "lootAlliances",
      ),
    );

    const alliances: SkullKingRoomLootAlliance[] =
      alliancesSnapshot.docs.map((allianceDoc) => {
        const data = allianceDoc.data();

        return {
          id: allianceDoc.id,
          roomId,
          round,
          giverPlayerId: data.giverPlayerId,
          receiverPlayerId: data.receiverPlayerId,
          createdByPlayerId:
            data.createdByPlayerId,
          createdAt:
            data.createdAt?.toDate().toISOString() ??
            new Date(0).toISOString(),
        };
      });

    alliances.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );

    return alliances;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `현재 라운드 약탈품 동맹 조회 실패: ${message}`,
    );
  }
}

export async function getRoomLootAlliances(
  roomId: string,
): Promise<SkullKingRoomLootAlliance[]> {
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

    const alliances: SkullKingRoomLootAlliance[] =
      [];

    for (const roundDoc of roundsSnapshot.docs) {
      const round = Number(roundDoc.id);

      const alliancesSnapshot = await getDocs(
        collection(
          db,
          "rooms",
          roomId,
          "rounds",
          roundDoc.id,
          "lootAlliances",
        ),
      );

      for (const allianceDoc of
        alliancesSnapshot.docs) {
        const data = allianceDoc.data();

        alliances.push({
          id: allianceDoc.id,
          roomId,
          round,
          giverPlayerId: data.giverPlayerId,
          receiverPlayerId:
            data.receiverPlayerId,
          createdByPlayerId:
            data.createdByPlayerId,
          createdAt:
            data.createdAt
              ?.toDate()
              .toISOString() ?? null,
        });
      }
    }

    alliances.sort((a, b) => {
      if (a.round !== b.round) {
        return a.round - b.round;
      }

      return (a.createdAt ?? "").localeCompare(
        b.createdAt ?? "",
      );
    });

    return alliances;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `전체 약탈품 동맹 조회 실패: ${message}`,
    );
  }
}

type ReplacePlayerLootAlliancesInput = {
  roomId: string;
  round: number;
  playerId: string;
  receiverIds: string[];
};

export async function replacePlayerLootAlliances({
  roomId,
  round,
  playerId,
  receiverIds,
}: ReplacePlayerLootAlliancesInput): Promise<void> {
  if (receiverIds.length > 2) {
    throw new Error(
      "약탈품 동맹은 최대 2개까지 입력할 수 있습니다.",
    );
  }

  if (
    receiverIds.some(
      (receiverId) =>
        receiverId === playerId,
    )
  ) {
    throw new Error(
      "자기 자신과 약탈품 동맹을 맺을 수 없습니다.",
    );
  }

  try {
    const alliancesRef = collection(
      db,
      "rooms",
      roomId,
      "rounds",
      String(round),
      "lootAlliances",
    );

    const alliancesSnapshot =
      await getDocs(alliancesRef);

    const batch = writeBatch(db);

    for (const allianceDoc of alliancesSnapshot.docs) {
      const data = allianceDoc.data();

      if (
        data.createdByPlayerId === playerId
      ) {
        batch.delete(allianceDoc.ref);
      }
    }

    for (const receiverId of receiverIds) {
      const allianceRef = doc(alliancesRef);

      batch.set(allianceRef, {
        giverPlayerId: playerId,
        receiverPlayerId: receiverId,
        createdByPlayerId: playerId,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `약탈품 동맹 저장 실패: ${message}`,
    );
  }
}