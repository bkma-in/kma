export type CFPStatus = 'draft' | 'scheduled' | 'published' | 'closed' | 'archived';

export interface ImportantDateItem {
  label: string;
  date: string;
}

export interface CFPAttachment {
  url: string;
  fileName: string;
}

export interface CallForPaper {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  theme?: string;
  volume: string;
  issue: string;
  openingDate: string;
  deadline: string;
  publicationDate?: string;
  eligibility?: string;
  topics: string[];
  authorGuidelines?: string;
  paperFormatRequirements?: string;
  reviewProcess?: string;
  importantDates: ImportantDateItem[];
  contactEmail: string;
  contactPhone?: string;
  attachment?: CFPAttachment | null;
  banner?: string | null;
  status: CFPStatus;
  isPublished: boolean;
  lastPublishedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientBreakdown {
  authors: number;
  readers: number;
  reviewers: number;
  subscribers: number;
}

export interface RecipientEstimateResponse {
  success: boolean;
  breakdown: RecipientBreakdown;
  totalEstimated: number;
}

export interface PublishCFPOptions {
  sendInAppNotification: boolean;
  sendEmailNotification: boolean;
  recipients: {
    authors: boolean;
    readers: boolean;
    reviewers: boolean;
    subscribers: boolean;
  };
}

export interface QueueStats {
  totalRecipients: number;
  sentCount: number;
  pendingCount: number;
  failedCount: number;
  emailsSentToday: number;
  dailyLimit: number;
  quotaUsedFormatted: string;
  estimatedCompletionDate: string | null;
  progressPercentage: number;
}

export interface NotificationPreferences {
  callForPapers: boolean;
  announcements: boolean;
  invoices: boolean;
  receipts: boolean;
  subscriptionRenewals: boolean;
  reviewAssignments: boolean;
  articleDecisions: boolean;
}
