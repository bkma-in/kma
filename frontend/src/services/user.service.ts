import api from './api';

let cachedProfilePromise: Promise<any> | null = null;
let cachedProfileData: any = null;

export const getProfile = async () => {
  if (cachedProfileData) {
    return { success: true, profile: cachedProfileData };
  }
  if (!cachedProfilePromise) {
    cachedProfilePromise = api.get('/users/profile').then(res => {
      if (res.data && res.data.success) {
        cachedProfileData = res.data.profile;
      }
      return res.data;
    }).catch(err => {
      cachedProfilePromise = null;
      throw err;
    });
  }
  return cachedProfilePromise;
};

export const clearProfileCache = () => {
  cachedProfilePromise = null;
  cachedProfileData = null;
};

export const updateProfile = async (formData: FormData) => {
  const response = await api.put('/users/profile', formData);
  if (response.data && response.data.success) {
    cachedProfileData = response.data.profile;
  }
  return response.data;
};

export const reportIssue = async (formData: FormData) => {
  const response = await api.post('/users/report-issue', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getReportedIssues = async () => {
  const response = await api.get('/users/reported-issues');
  return response.data;
};

export const updateIssueStatus = async (issueId: string, status: string) => {
  const response = await api.patch(`/users/reported-issues/${issueId}/status`, { status });
  return response.data;
};

export const getReviewers = async () => {
  const response = await api.get('/users/reviewers');
  return response.data;
};

export const updateReviewerStatus = async (id: string, status: string, rejectionReason?: string) => {
  const response = await api.patch(`/users/reviewers/${id}/status`, { status, rejectionReason });
  return response.data;
};

export const addReviewer = async (reviewerData: { name: string; email: string; qualification: string; experience: string }) => {
  const response = await api.post('/users/reviewers', reviewerData);
  return response.data;
};

export const getAuthors = async () => {
  const response = await api.get('/users/authors');
  return response.data;
};

export const getReaders = async () => {
  const response = await api.get('/users/readers');
  return response.data;
};

export const resendReviewerCredentials = async (id: string) => {
  const response = await api.post(`/users/reviewers/${id}/resend-credentials`);
  return response.data;
};

// ==========================================
// KMA LIFE MEMBERS
// ==========================================

export const getLifeMembers = async () => {
  const response = await api.get('/users/life-members');
  return response.data;
};

export const addLifeMember = async (memberData: {
  uniqueId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  affiliation?: string;
  address?: string;
  notes?: string;
  enrolledDate?: string;
  sendWelcomeEmail?: boolean;
}) => {
  const response = await api.post('/users/life-members', memberData);
  return response.data;
};

export const importLifeMembers = async (
  formDataOrData: FormData | { rows: any[]; conflictMode?: string },
  conflictMode: 'skip' | 'overwrite' = 'skip'
) => {
  if (formDataOrData instanceof FormData) {
    if (!formDataOrData.has('conflictMode')) {
      formDataOrData.append('conflictMode', conflictMode);
    }
    const response = await api.post(`/users/life-members/import?conflictMode=${conflictMode}`, formDataOrData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  const response = await api.post('/users/life-members/import', { ...formDataOrData, conflictMode });
  return response.data;
};

export const updateLifeMember = async (id: string, data: any) => {
  const response = await api.put(`/users/life-members/${id}`, data);
  return response.data;
};

export const deleteLifeMember = async (id: string) => {
  const response = await api.delete(`/users/life-members/${id}`);
  return response.data;
};


