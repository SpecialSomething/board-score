import {
  signInAnonymously,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const credential = await signInAnonymously(auth);

    return credential.user;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류";

    throw new Error(
      `익명 로그인에 실패했습니다: ${message}`,
    );
  }
}