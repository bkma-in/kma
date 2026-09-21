export interface EditorMember {
  id?: string;
  name: string;
  category: 'core' | 'academic' | 'associate' | 'advisory' | string;
  categoryTitle?: string;
  role?: string;
  affiliation: string;
  email?: string;
  phone?: string;
  areas?: string;
  profileImage?: string | null;
  order?: number;
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface EditorialPolicy {
  policyText?: string;
  periodicityText?: string;
  submissionGuidelines?: string;
  referencesFormat?: string;
  subscriptionText?: string;
  copyrightNotice?: string;
  updatedAt?: any;
}

export interface EditorialBoardResponse {
  success: boolean;
  editors: EditorMember[];
  grouped: {
    core: EditorMember[];
    academic: EditorMember[];
    associate: EditorMember[];
    custom: { [key: string]: EditorMember[] };
  };
  policy: EditorialPolicy;
  error?: string;
}

export interface AdminEditorialBoardResponse {
  success: boolean;
  editors: EditorMember[];
  policy: EditorialPolicy;
  error?: string;
}
