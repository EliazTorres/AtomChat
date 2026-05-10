import type { Conversation } from '../types/chat';

export type DateGroup = {
  label: string;
  conversations: Conversation[];
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysDiff(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / msPerDay);
}

export function groupConversationsByDate(conversations: Conversation[]): DateGroup[] {
  const now = new Date();
  const groups: Map<string, Conversation[]> = new Map();

  for (const conv of conversations) {
    const diff = daysDiff(conv.updatedAt, now);
    let label: string;

    if (diff === 0) label = 'Today';
    else if (diff === 1) label = 'Yesterday';
    else if (diff <= 7) label = 'This week';
    else if (diff <= 30) label = 'This month';
    else {
      // Group by month/year for older items
      label = conv.updatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(conv);
  }

  // Maintain chronological group order
  const ORDER = ['Today', 'Yesterday', 'This week', 'This month'];
  const result: DateGroup[] = [];

  for (const label of ORDER) {
    if (groups.has(label)) {
      result.push({ label, conversations: groups.get(label)! });
      groups.delete(label);
    }
  }

  // Remaining older groups sorted newest first
  for (const [label, convs] of groups) {
    result.push({ label, conversations: convs });
  }

  return result;
}

export function formatRelativeDate(date: Date): string {
  const diff = daysDiff(date, new Date());
  if (diff === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
