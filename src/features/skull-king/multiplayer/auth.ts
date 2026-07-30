import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export async function ensureAnonymousUser(): Promise<User> {
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  if (
    getUserError &&
    getUserError.name !== "AuthSessionMissingError"
  ) {
    console.error(
      "기존 사용자 확인 중 오류가 발생했습니다.",
      getUserError,
    );
  }

  const {
    data,
    error: signInError,
  } = await supabase.auth.signInAnonymously();

  if (signInError) {
    throw new Error(
      `익명 로그인에 실패했습니다: ${signInError.message}`,
    );
  }

  if (!data.user) {
    throw new Error(
      "익명 로그인은 완료됐지만 사용자 정보를 받지 못했습니다.",
    );
  }

  return data.user;
}