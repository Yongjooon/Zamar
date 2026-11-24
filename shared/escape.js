// These tokens are printed as QR codes. Their order determines the digit position.
export const ESCAPE_CLUES = [
  { id: 'forest', digit: '6', token: 'zamar:escape:v1:9f98c877-43ba-4e79-9d58-a49282f8c16c' },
  { id: 'meadow', digit: '3', token: 'zamar:escape:v1:21a5632d-090b-46cc-b102-e3f5c9d8a430' },
  { id: 'courtyard', digit: '7', token: 'zamar:escape:v1:3872f193-291c-4d21-8408-72ad39b7d560' },
  { id: 'doorway', digit: '1', token: 'zamar:escape:v1:487fe150-898f-4d59-a83f-1ba02409de80' },
];

export function escapeState(record) {
  const saved = Array.isArray(record?.opened) ? record.opened : [];
  const opened = ESCAPE_CLUES.filter(({ id }) => saved.includes(id)).map(({ id }) => id);
  return { round: Number.isSafeInteger(record?.round) && record.round >= 0 ? record.round : 0, opened };
}

export function escapeView(record) {
  const { round, opened } = escapeState(record);
  return {
    round,
    digits: ESCAPE_CLUES.map(({ id, digit }) => opened.includes(id) ? digit : '?'),
    found: opened.length,
    complete: opened.length === ESCAPE_CLUES.length,
  };
}
