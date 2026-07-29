import { supabase } from "@/lib/supabase";

export interface SkullKingBid {
  id: string;
  room_id: string;
  player_id: string;
  round: number;
  bid: number;
  submitted_at: string;
  updated_at: string;
}

interface SubmitBidParams {
  roomId: string;
  playerId: string;
  round: number;
  bid: number;
}

interface CheckAllBidsSubmittedParams {
  roomId: string;
  round: number;
  playerCount: number;
}

interface AdvanceToScoringParams {
  roomId: string;
  round: number;
  playerCount: number;
}

/**
 * 특정 라운드의 예측 목록을 조회합니다.
 */
export async function getRoundBids(
  roomId: string,
  round: number,
): Promise<SkullKingBid[]> {

  const { data, error } = await supabase
    .from("skull_king_bids")
    .select(
      `
        id,
        room_id,
        player_id,
        round,
        bid,
        submitted_at,
        updated_at
      `,
    )
    .eq("room_id", roomId)
    .eq("round", round)
    .order("submitted_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `예측 목록을 불러오지 못했습니다: ${error.message}`,
    );
  }

  return (data ?? []) as SkullKingBid[];
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
}: SubmitBidParams): Promise<SkullKingBid> {
  validateBidInput({
    roomId,
    playerId,
    round,
    bid,
  });

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("skull_king_bids")
    .upsert(
      {
        room_id: roomId,
        player_id: playerId,
        round,
        bid,
        submitted_at: now,
        updated_at: now,
      },
      {
        onConflict: "room_id,player_id,round",
      },
    )
    .select(
      `
        id,
        room_id,
        player_id,
        round,
        bid,
        submitted_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(
      `예측을 제출하지 못했습니다: ${error.message}`,
    );
  }

  return data as SkullKingBid;
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

  const { data, error } = await supabase
    .from("skull_king_bids")
    .select(
      `
        id,
        room_id,
        player_id,
        round,
        bid,
        submitted_at,
        updated_at
      `,
    )
    .eq("room_id", roomId)
    .eq("player_id", playerId)
    .eq("round", round)
    .maybeSingle();

  if (error) {
    throw new Error(
      `플레이어의 예측을 불러오지 못했습니다: ${error.message}`,
    );
  }

  return data as SkullKingBid | null;
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


  const { count, error } = await supabase
    .from("skull_king_bids")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("room_id", roomId)
    .eq("round", round);

  if (error) {
    throw new Error(
      `예측 제출 현황을 확인하지 못했습니다: ${error.message}`,
    );
  }

  return count === playerCount;
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
  playerCount,
}: AdvanceToScoringParams): Promise<boolean> {
  const allSubmitted =
    await haveAllPlayersSubmittedBids({
      roomId,
      round,
      playerCount,
    });

  if (!allSubmitted) {
    return false;
  }


  const { data, error } = await supabase
    .from("skull_king_rooms")
    .update({
      status: "scoring",
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("current_round", round)
    .eq("status", "bidding")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `결과 입력 단계로 전환하지 못했습니다: ${error.message}`,
    );
  }

  return data !== null;
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
  const { data, error } = await supabase
    .from("skull_king_bids")
    .select("*")
    .eq("room_id", roomId)
    .order("round", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      "전체 예측 정보를 불러오지 못했습니다.",
    );
  }

  return data ?? [];
}