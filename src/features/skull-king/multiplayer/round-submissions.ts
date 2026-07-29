import { supabase } from "@/lib/supabase";

import type {
  SkullKingRoundSubmission,
} from "./types";

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

  const { data, error } = await supabase
    .from("skull_king_round_submissions")
    .select(
      `
      id,
      room_id,
      player_id,
      round,
      tricks,
      standard_fourteens_count,
      black_fourteen_captured,
      mermaids_captured_by_pirate,
      pirates_captured_by_skull_king,
      skull_king_captured_by_mermaid,
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
      `라운드 결과를 불러오지 못했습니다: ${error.message}`,
    );
  }

  return (data ?? []).map((submission) =>
    mapRoundSubmission(submission),
  );
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

  const { data, error } = await supabase
    .from("skull_king_round_submissions")
    .select(
      `
      id,
      room_id,
      player_id,
      round,
      tricks,
      standard_fourteens_count,
      black_fourteen_captured,
      mermaids_captured_by_pirate,
      pirates_captured_by_skull_king,
      skull_king_captured_by_mermaid,
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
      `내 라운드 결과를 불러오지 못했습니다: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return mapRoundSubmission(data);
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
  });

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("skull_king_round_submissions")
    .upsert(
      {
        room_id: roomId,
        player_id: playerId,
        round,
        tricks,
        standard_fourteens_count:
          standardFourteensCount,
        black_fourteen_captured:
          blackFourteenCaptured,
        mermaids_captured_by_pirate:
          mermaidsCapturedByPirate,
        pirates_captured_by_skull_king:
          piratesCapturedBySkullKing,
        skull_king_captured_by_mermaid:
          skullKingCapturedByMermaid,
        submitted_at: now,
        updated_at: now,
      },
      {
        onConflict:
          "room_id,round,player_id",
      },
    )
    .select(
      `
      id,
      room_id,
      player_id,
      round,
      tricks,
      standard_fourteens_count,
      black_fourteen_captured,
      mermaids_captured_by_pirate,
      pirates_captured_by_skull_king,
      skull_king_captured_by_mermaid,
      submitted_at,
      updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(
      `라운드 결과를 제출하지 못했습니다: ${error.message}`,
    );
  }

  return mapRoundSubmission(data);
}

/**
 * 현재 라운드에 모든 플레이어가 결과를 제출했는지 확인합니다.
 */
export async function haveAllPlayersSubmittedRoundResults({
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

  const { count, error } = await supabase
    .from("skull_king_round_submissions")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("room_id", roomId)
    .eq("round", round);

  if (error) {
    throw new Error(
      `결과 제출 현황을 확인하지 못했습니다: ${error.message}`,
    );
  }

  return count === playerCount;
}

/**
 * Supabase의 snake_case 데이터를
 * 애플리케이션의 camelCase 타입으로 변환합니다.
 */
function mapRoundSubmission(
  submission: {
    id: string;
    room_id: string;
    player_id: string;
    round: number;
    tricks: number;
    standard_fourteens_count: number;
    black_fourteen_captured: boolean;
    mermaids_captured_by_pirate: number;
    pirates_captured_by_skull_king: number;
    skull_king_captured_by_mermaid: boolean;
    submitted_at: string;
    updated_at: string;
  },
): SkullKingRoundSubmission {
  return {
    id: submission.id,
    roomId: submission.room_id,
    playerId: submission.player_id,
    round: submission.round,
    tricks: submission.tricks,
    standardFourteensCount:
      submission.standard_fourteens_count,
    blackFourteenCaptured:
      submission.black_fourteen_captured,
    mermaidsCapturedByPirate:
      submission.mermaids_captured_by_pirate,
    piratesCapturedBySkullKing:
      submission.pirates_captured_by_skull_king,
    skullKingCapturedByMermaid:
      submission.skull_king_captured_by_mermaid,
    submittedAt: submission.submitted_at,
    updatedAt: submission.updated_at,
  };
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
    round,
  );

  validateCount(
    mermaidsCapturedByPirate,
    "해적이 잡은 인어 수",
    round,
  );

  validateCount(
    piratesCapturedBySkullKing,
    "스컬 킹이 잡은 해적 수",
    round,
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
  const { data, error } = await supabase
    .from("skull_king_round_submissions")
    .select("*")
    .eq("room_id", roomId)
    .order("round", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      "전체 라운드 결과를 불러오지 못했습니다.",
    );
  }

  return (data ?? []).map((submission) => ({
    id: submission.id,
    roomId: submission.room_id,
    playerId: submission.player_id,
    round: submission.round,
    tricks: submission.tricks,

    standardFourteensCount:
      submission.standard_fourteens_count,

    blackFourteenCaptured:
      submission.black_fourteen_captured,

    mermaidsCapturedByPirate:
      submission.mermaids_captured_by_pirate,

    piratesCapturedBySkullKing:
      submission.pirates_captured_by_skull_king,

    skullKingCapturedByMermaid:
      submission.skull_king_captured_by_mermaid,

    submittedAt:
      submission.submitted_at,
    
    updatedAt:
      submission.updated_at
  }));
}