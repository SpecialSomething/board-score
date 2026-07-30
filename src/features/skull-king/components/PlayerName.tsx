type PlayerNameProps = {
  name: string;
  isMe?: boolean;
  className?: string;
};

export default function PlayerName({
  name,
  isMe = false,
  className = "",
}: PlayerNameProps) {
  return (
    <span className={className}>
      {name}

      {isMe && (
        <span className="ml-1 text-xs text-board-text-muted">
          (나)
        </span>
      )}
    </span>
  );
}