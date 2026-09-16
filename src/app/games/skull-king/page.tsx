"use client";

import { useRouter } from "next/navigation";

export default function SkullKingModePage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex w-full max-w-[393px] flex-col gap-6 px-6 py-6">
      <div>
        <h2 className="text-2xl font-bold text-board-text">
          계산 방식 선택
        </h2>
        <p className="mt-1 text-sm text-board-muted">
          점수를 입력할 방식을 선택하세요.
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push("/games/skull-king/single?new=1")}
          className="rounded-2xl border border-board-border bg-white p-5 text-left transition-colors hover:bg-board-primary-soft"
        >
          <span className="block text-lg font-semibold text-board-text">
            한 기기에서 계산
          </span>

          <span className="mt-1 block text-sm text-board-text-muted">
            한 사람이 모든 플레이어의 점수를 입력해요.
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/games/skull-king/multi")}
          className="rounded-2xl border border-board-border bg-white p-5 text-left transition-colors hover:bg-board-primary-soft"
        >
          <span className="block text-lg font-semibold text-board-text">
            각자 입력하기
          </span>

          <span className="mt-1 block text-sm text-board-text-muted">
            각 플레이어가 자신의 휴대폰에서 직접 입력해요.
          </span>
        </button>
      </section>
    </main>
  );
}