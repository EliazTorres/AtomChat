export interface SuggestedPrompt {
  id: string;
  icon: string;
  title: string;
  description: string; // shown as subtitle on the card
  template: string;    // pre-fills the input — user completes before sending
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'p1',
    icon: 'auto_awesome',
    title: 'Plan a project',
    description: 'Structure a technical roadmap',
    template: 'Help me plan a project: ',
  },
  {
    id: 'p2',
    icon: 'code',
    title: 'Analyze this code',
    description: 'Review logic & find issues',
    template: 'Analyze this code and identify bugs, performance issues, and improvements:\n\n```\n\n```',
  },
  {
    id: 'p3',
    icon: 'architecture',
    title: 'System Design',
    description: 'Design a scalable architecture',
    template: 'Design a system architecture for: ',
  },
  {
    id: 'p4',
    icon: 'bug_report',
    title: 'Debug an error',
    description: 'Help fix a bug or exception',
    template: 'Help me debug this error:\n\nError: \n\nCode:\n```\n\n```',
  },
  {
    id: 'p5',
    icon: 'school',
    title: 'Explain a concept',
    description: 'Learn something clearly',
    template: 'Explain ',
  },
  {
    id: 'p6',
    icon: 'edit_note',
    title: 'Write / Refactor',
    description: 'Write or improve code',
    template: 'Write a ',
  },
];
