export type IssueStatus = 'Open' | 'In Progress' | 'Resolved';

export interface Issue {
  id: string;
  type: string;
  description: string;
  screenshot: string | null;
  status: IssueStatus;
  createdAt: string;
  metadata: {
    url: string;
    role: string;
    user: string;
    userAgent: string;
    lastError: string | null;
  };
}
