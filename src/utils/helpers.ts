let counter = 0;

export function generateId(): string {
  return `msg-${++counter}-${Date.now()}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
