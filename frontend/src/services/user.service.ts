import api from './api';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (formData: FormData) => {
  const response = await api.put('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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
