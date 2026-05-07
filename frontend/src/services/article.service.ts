import api from './api';

export const getArticles = async () => {
  const response = await api.get('/articles');
  return response.data;
};

export const submitArticle = async (formData: FormData) => {
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
