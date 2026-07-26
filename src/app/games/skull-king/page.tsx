"use client";

import { useRouter } from "next/navigation";

import Header from "@/components/Header";

export default function SkullKingModePage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <Header 
        title="스컬킹"
        description="점수를 입력할 방식을 선택하세요."
      />

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