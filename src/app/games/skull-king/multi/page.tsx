import Link from "next/link";

export default function SkullKingMultiPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-board-bg p-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-board-text">
          각자 입력하기
        </h2>
        <p className="mt-1 text-sm text-board-muted">
          방을 만들거나 기존 방에 참가하세요.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Link
          href="/games/skull-king/multi/create"
          className="flex h-12 items-center justify-center rounded-xl bg-board-primary font-semibold text-white"
        >
          방 만들기
        </Link>

        <Link
          href="/games/skull-king/multi/join"
          className="flex h-12 items-center justify-center rounded-xl border border-board-primary bg-board-surface font-semibold text-board-primary"
        >
          방 참가하기
        </Link>
      </div>
    </main>
  );
}