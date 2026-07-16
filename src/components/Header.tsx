import Link from "next/link";

export default function Header() {
  return (
    <header className="mb-6">
      <Link href="/">
        <h1 className="text-[32px] font-bold text-board-text transition-colors hover:text-board-primary">
          Board Score
        </h1>
      </Link>

      <p className="text-sm text-board-muted">
        보드게임 점수 계산기
      </p>
    </header>
  );
}