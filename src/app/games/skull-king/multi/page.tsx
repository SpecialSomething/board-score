import Header from "@/components/Header";
import Link from "next/link";

export default function SkullKingMultiPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
      <Header 
          title="각자 입력하기"
          description="각자 계산하는 방식입니다. 추가할 예정입니다."
      />

      <Link
        href="/games/skull-king"
        className="rounded-xl bg-board-primary px-4 py-3 text-center font-semibold text-white"
      >
        계산 방식 선택으로 돌아가기
      </Link>
    </main>
  );
}