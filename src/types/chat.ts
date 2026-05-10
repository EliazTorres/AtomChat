export interface MessageAttachment {
  name: string;
  type: string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlock?: {
    comment: string;
    lines: string[];
  };
  feedback?: 'up' | 'down' | null;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  workspaceId?: string;
}

export interface UserProfile {
  name: string;
  plan: string;
  initials: string;
}

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
};

export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: Date;
  color: string;
}
