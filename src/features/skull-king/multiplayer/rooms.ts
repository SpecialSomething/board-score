import { supabase } from "@/lib/supabase";

import { ensureAnonymousUser } from "./auth";
import { 
    createRoomCode,
    normalizeRoomCode,
} from "./room-code";

import { SkullKingRoom, SkullKingRoomPlayer } from "./types";

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

    const {
      data: room,
      error: roomError,
    } = await supabase
      .from("skull_king_rooms")
      .insert({
        code: roomCode,
        created_by_user_id: user.id,
        status: "waiting",
        current_round: 1,
      })
      .select("id, code")
      .single();

    if (roomError) {
      // PostgreSQL unique_violation
      if (roomError.code === "23505") {
        continue;
      }

      throw new Error(
        `방 생성에 실패했습니다: ${roomError.message}`,
      );
    }

    const {
      data: player,
      error: playerError,
    } = await supabase
      .from("skull_king_room_players")
      .insert({
        room_id: room.id,
        user_id: user.id,
        name: trimmedName,
        seat: 1,
        is_ready: true,
      })
      .select("id")
      .single();

    if (playerError) {
      await supabase
        .from("skull_king_rooms")
        .delete()
        .eq("id", room.id);

      throw new Error(
        `방장 생성에 실패했습니다: ${playerError.message}`,
      );
    }

    const { error: hostUpdateError } =
      await supabase
        .from("skull_king_rooms")
        .update({
          host_player_id: player.id,
        })
        .eq("id", room.id);

    if (hostUpdateError) {
      await supabase
        .from("skull_king_rooms")
        .delete()
        .eq("id", room.id);

      throw new Error(
        `방장 설정에 실패했습니다: ${hostUpdateError.message}`,
      );
    }

    return {
      roomId: room.id,
      roomCode: room.code,
      playerId: player.id,
    };
  }

  throw new Error(
    "방 코드를 생성하지 못했습니다. 다시 시도해주세요.",
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

  const {
    data: room,
    error: roomError,
  } = await supabase
    .from("skull_king_rooms")
    .select(
      "id, code, status, current_round",
    )
    .eq("code", normalizedCode)
    .maybeSingle();

  if (roomError) {
    throw new Error(
      `방을 찾는 중 오류가 발생했습니다: ${roomError.message}`,
    );
  }

  if (!room) {
    throw new Error(
      "존재하지 않는 방 코드입니다.",
    );
  }

  if (room.status !== "waiting") {
    throw new Error(
      "이미 게임이 시작된 방입니다.",
    );
  }

  /*
   * 같은 브라우저에서 이미 이 방에 참가한 경우
   * 새로운 참가자를 만들지 않고 기존 참가자를 반환합니다.
   */
  const {
    data: existingPlayer,
    error: existingPlayerError,
  } = await supabase
    .from("skull_king_room_players")
    .select("id, name")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPlayerError) {
    throw new Error(
      `기존 참가 정보를 확인하지 못했습니다: ${existingPlayerError.message}`,
    );
  }

  if (existingPlayer) {
    return {
      roomId: room.id,
      roomCode: room.code,
      playerId: existingPlayer.id,
      playerName: existingPlayer.name,
    };
  }

  const {
    data: players,
    error: playersError,
  } = await supabase
    .from("skull_king_room_players")
    .select("seat")
    .eq("room_id", room.id)
    .order("seat", {
      ascending: true,
    });

  if (playersError) {
    throw new Error(
      `참가자 정보를 불러오지 못했습니다: ${playersError.message}`,
    );
  }

  if (players.length >= 8) {
    throw new Error(
      "참가 인원이 가득 찬 방입니다.",
    );
  }

  const usedSeats = new Set(
    players.map((player) => player.seat),
  );

  let nextSeat = 1;

  while (usedSeats.has(nextSeat)) {
    nextSeat += 1;
  }

  const {
    data: player,
    error: playerError,
  } = await supabase
    .from("skull_king_room_players")
    .insert({
      room_id: room.id,
      user_id: user.id,
      name: trimmedName,
      seat: nextSeat,
      is_ready: false,
    })
    .select("id")
    .single();

  if (playerError) {
    if (playerError.code === "23505") {
      throw new Error(
        "이미 사용 중인 이름이거나 참가 처리가 겹쳤습니다. 다시 시도해주세요.",
      );
    }

    throw new Error(
      `방 참가에 실패했습니다: ${playerError.message}`,
    );
  }

  return {
    roomId: room.id,
    roomCode: room.code,
    playerId: player.id,
    playerName: trimmedName,
  };
}

export async function getSkullKingRoom(
  roomId: string,
): Promise<SkullKingRoom> {
  const { data, error } = await supabase
    .from("skull_king_rooms")
    .select(
      "id, code, host_player_id, status, current_round, created_at, updated_at",
    )
    .eq("id", roomId)
    .single();

  if (error) {
    throw new Error(
      `방 정보를 불러오지 못했습니다: ${error.message}`,
    );
  }

  return {
    id: data.id,
    code: data.code,
    hostPlayerId: data.host_player_id,
    status: data.status,
    currentRound: data.current_round,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSkullKingRoomPlayers(
  roomId: string,
): Promise<SkullKingRoomPlayer[]> {
  const { data: room, error: roomError } =
    await supabase
      .from("skull_king_rooms")
      .select("host_player_id")
      .eq("id", roomId)
      .single();

  if (roomError) {
    throw new Error(
      `방 정보를 불러오지 못했습니다: ${roomError.message}`,
    );
  }

  const { data: players, error: playersError } =
    await supabase
      .from("skull_king_room_players")
      .select(
        `
        id,
        room_id,
        name,
        seat,
        is_ready,
        joined_at
        `,
      )
      .eq("room_id", roomId)
      .order("seat", {
        ascending: true,
      });

  if (playersError) {
    throw new Error(
      `참가자 목록을 불러오지 못했습니다: ${playersError.message}`,
    );
  }

  return (players ?? []).map((player) => ({
    id: player.id,
    roomId: player.room_id,
    name: player.name,
    seat: player.seat,
    isHost:
      player.id === room.host_player_id,
    isReady: player.is_ready,
    joinedAt: player.joined_at,
  }));
}

export async function updateSkullKingPlayerReady(
    playerId: string,
    isReady: boolean,
): Promise<void> {
    const { error } = await supabase
        .from("skull_king_room_players")
        .update({
            is_ready: isReady,
        })
        .eq("id", playerId);

    if (error) {
        throw new Error(
            `준비 상태를 변경하지 못했습니다: ${error.message}`,
        );
    }
}

export async function startSkullKingGame(
  roomId: string,
  playerId: string,
): Promise<void> {
  const { data: room, error: roomError } =
    await supabase
      .from("skull_king_rooms")
      .select(
        `
        id,
        status,
        host_player_id
        `,
      )
      .eq("id", roomId)
      .single();

  if (roomError) {
    throw new Error(
      `방 정보를 불러오지 못했습니다: ${roomError.message}`,
    );
  }

  if (room.host_player_id !== playerId) {
    throw new Error(
      "방장만 게임을 시작할 수 있습니다.",
    );
  }

  if (room.status !== "waiting") {
    throw new Error(
      "이미 시작됐거나 시작할 수 없는 방입니다.",
    );
  }

  const { data: players, error: playersError } =
    await supabase
      .from("skull_king_room_players")
      .select("id, is_ready")
      .eq("room_id", roomId);

  if (playersError) {
    throw new Error(
      `참가자 정보를 불러오지 못했습니다: ${playersError.message}`,
    );
  }

  if (!players || players.length < 2) {
    throw new Error(
      "게임을 시작하려면 최소 2명이 필요합니다.",
    );
  }

  const areAllPlayersReady =
    players.every((player) => player.is_ready);

  if (!areAllPlayersReady) {
    throw new Error(
      "모든 참가자가 준비해야 합니다.",
    );
  }

  const { error: updateError } =
    await supabase
      .from("skull_king_rooms")
      .update({
        status: "bidding",
        current_round: 1,
      })
      .eq("id", roomId)
      .eq("status", "waiting");

  if (updateError) {
    throw new Error(
      `게임을 시작하지 못했습니다: ${updateError.message}`,
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

  const { data, error } = await supabase
    .from("skull_king_rooms")
    .update(
      isLastRound
        ? {
            status: "finished",
            updated_at:
              new Date().toISOString(),
          }
        : {
            status: "bidding",
            current_round:
              currentRound + 1,
            updated_at:
              new Date().toISOString(),
          },
    )
    .eq("id", roomId)
    .eq("host_player_id", hostPlayerId)
    .eq("status", "round-result")
    .eq("current_round", currentRound)
    .select()
    .single();

  if (error) {
    throw new Error(
      isLastRound
        ? "게임을 종료하지 못했습니다."
        : "다음 라운드로 넘어가지 못했습니다.",
    );
  }

  return {
    id: data.id,
    code: data.code,
    hostPlayerId: data.host_player_id,
    status: data.status,
    currentRound: data.current_round,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
  const { data, error } = await supabase
    .from("skull_king_rooms")
    .update({
      status: toStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("host_player_id", hostPlayerId)
    .eq("status", fromStatus)
    .select()
    .single();

  if (error) {
    throw new Error("방 상태를 변경하지 못했습니다.");
  }

  return {
    id: data.id,
    code: data.code,
    hostPlayerId: data.host_player_id,
    status: data.status,
    currentRound: data.current_round,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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

  const { error } = await supabase.rpc(
    "reset_skull_king_room_for_rematch",
    {
      p_room_id: roomId,
    },
  );

  if (error) {
    throw new Error(
      `새 게임을 준비하지 못했습니다: ${error.message}`,
    );
  }
}