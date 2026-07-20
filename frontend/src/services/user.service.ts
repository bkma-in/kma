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
  const response = await api.put('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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

