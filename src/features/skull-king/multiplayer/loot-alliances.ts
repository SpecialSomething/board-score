import { supabase } from "@/lib/supabase";

import type {
  SkullKingRoomLootAlliance,
} from "@/features/skull-king/multiplayer/types";

type LootAllianceRow = {
  id: string;
  room_id: string;
  round: number;
  giver_player_id: string;
  receiver_player_id: string;
  created_by_player_id: string;
  created_at: string;
};

function mapLootAllianceRow(
  row: LootAllianceRow,
): SkullKingRoomLootAlliance {
  return {
    id: row.id,
    roomId: row.room_id,
    round: row.round,
    giverPlayerId: row.giver_player_id,
    receiverPlayerId: row.receiver_player_id,
    createdByPlayerId:
      row.created_by_player_id,
    createdAt: row.created_at,
  };
}

export async function getRoundLootAlliances(
  roomId: string,
  round: number,
): Promise<SkullKingRoomLootAlliance[]> {
  const { data, error } = await supabase
    .from("skull_king_loot_alliances")
    .select(
      `
        id,
        room_id,
        round,
        giver_player_id,
        receiver_player_id,
        created_by_player_id,
        created_at
      `,
    )
    .eq("room_id", roomId)
    .eq("round", round)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `현재 라운드 약탈품 동맹 조회 실패: ${error.message}`,
    );
  }

  return (data ?? []).map((row) =>
    mapLootAllianceRow(
      row as LootAllianceRow,
    ),
  );
}

export async function getRoomLootAlliances(
  roomId: string,
): Promise<SkullKingRoomLootAlliance[]> {
  const { data, error } = await supabase
    .from("skull_king_loot_alliances")
    .select(
      `
        id,
        room_id,
        round,
        giver_player_id,
        receiver_player_id,
        created_by_player_id,
        created_at
      `,
    )
    .eq("room_id", roomId)
    .order("round", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `전체 약탈품 동맹 조회 실패: ${error.message}`,
    );
  }

  return (data ?? []).map((row) =>
    mapLootAllianceRow(
      row as LootAllianceRow,
    ),
  );
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

  const { error: deleteError } =
    await supabase
      .from("skull_king_loot_alliances")
      .delete()
      .eq("room_id", roomId)
      .eq("round", round)
      .eq(
        "created_by_player_id",
        playerId,
      );

  if (deleteError) {
    throw new Error(
      `기존 약탈품 동맹 삭제 실패: ${deleteError.message}`,
    );
  }

  if (receiverIds.length === 0) {
    return;
  }

  const rows = receiverIds.map(
    (receiverId) => ({
      room_id: roomId,
      round,
      giver_player_id: playerId,
      receiver_player_id: receiverId,
      created_by_player_id: playerId,
    }),
  );

  const { error: insertError } =
    await supabase
      .from("skull_king_loot_alliances")
      .insert(rows);

  if (insertError) {
    throw new Error(
      `약탈품 동맹 저장 실패: ${insertError.message}`,
    );
  }
}