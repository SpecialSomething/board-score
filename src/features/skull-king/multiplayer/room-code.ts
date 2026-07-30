const ROOM_CODE_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ROOM_CODE_LENGTH = 6;

export function createRoomCode(): string {
  return Array.from(
    { length: ROOM_CODE_LENGTH },
    () => {
      const randomIndex = Math.floor(
        Math.random() * ROOM_CODE_CHARACTERS.length,
      );

      return ROOM_CODE_CHARACTERS[randomIndex];
    },
  ).join("");
}

export function normalizeRoomCode(
  roomCode: string,
): string {
  return roomCode
    .trim()
    .replaceAll(" ", "")
    .toUpperCase();
}