import Link from "next/link";

type HeaderProps = {
  title?: string;
  description?: string;
};

export default function Header({
  title,
  description,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-3">

        <div>
          <Link href="/">
            <h1 className="text-[32px] font-bold text-board-text transition-colors hover:text-board-primary">
              Board Score
            </h1>
          </Link>

          <p className="text-sm text-board-muted">
            보드게임 점수 계산기
          </p>
        </div>
      </div>

      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-2xl font-bold text-board-text">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-1 text-sm text-board-muted">
              {description}
            </p>
          )}
        </div>
      )}
    </header>
  );
}