/**
 * CreatorPilot AI Shared Types and Interfaces
 */

export type UserPlan = 'free' | 'starter' | 'creator' | 'agency';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  plan: UserPlan;
  credits: number;
  maxCredits: number;
  createdAt: string;
  emailVerified: boolean;
}

export type AIToolId =
  | 'profile-audit'
  | 'caption-gen'
  | 'hook-gen'
  | 'hashtag-gen'
  | 'bio-gen'
  | 'content-calendar'
  | 'script-gen'
  | 'comment-reply'
  | 'brand-email'
  | 'competitor-analyzer'
  | 'screenshot-analyzer'
  | 'image-prompt'
  | 'video-prompt'
  | 'thumbnail-text'
  | 'trend-analyzer';

export interface AIToolInfo {
  id: AIToolId;
  name: string;
  description: string;
  category: 'social' | 'growth' | 'creative' | 'business';
  creditsCost: number;
  icon: string; // lucide icon name
  inputs: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'image';
    placeholder?: string;
    options?: string[];
    required?: boolean;
    helpText?: string;
  }>;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  toolId: AIToolId;
  toolName: string;
  inputs: Record<string, string>;
  output: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'shorts' | 'tiktok' | 'instagram' | 'youtube' | 'newsletter' | 'brand';
  tags: string[];
  usageCount: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  image: string;
  views: number;
  comments: BlogComment[];
  createdAt: string;
}

export interface BlogComment {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
  replies?: Array<{
    sender: 'user' | 'admin';
    message: string;
    createdAt: string;
  }>;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  plan: UserPlan;
  status: 'paid' | 'open' | 'failed';
  date: string;
  invoiceUrl: string;
}

export interface AdminSettings {
  defaultModel: string;
  systemPrompt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface SystemStats {
  totalUsers: number;
  activePremium: number;
  totalGenerations: number;
  creditsConsumed: number;
  recentGenerations: Array<{
    id: string;
    userEmail: string;
    toolName: string;
    createdAt: string;
  }>;
  systemLogs: Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}
