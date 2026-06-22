import api from './api';

export const getArticles = async () => {
  const response = await api.get('/articles');
  return response.data;
};

export const getPublishedArticles = async () => {
  const response = await api.get('/articles/published');
  return response.data;
};

export const deleteArticle = async (id: string) => {
  const response = await api.delete(`/articles/${id}`);
  return response.data;
};

export const submitArticle = async (formData: FormData) => {
// ...
  const response = await api.post('/articles', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPdfUrl = async (articleId: string) => {
  const response = await api.get(`/articles/${articleId}/pdf`);
  return response.data;
};

export const updateArticle = async (id: string, formData: FormData) => {
  const response = await api.put(`/articles/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const assignReviewers = async (id: string, reviewerIds: string[], reviewerNames: string[]) => {
  const response = await api.patch(`/articles/${id}/assign`, { reviewerIds, reviewerNames });
  return response.data;
};

export const updateArticleStatus = async (id: string, status: string, extraData?: { rejectionReason?: string; adminNote?: string; remarks?: string; recommendation?: string; reviewedFile?: any }) => {
  const response = await api.patch(`/articles/${id}/status`, { status, ...extraData });
  return response.data;
};
