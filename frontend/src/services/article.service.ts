import api from './api';

export const getArticles = async () => {
  const response = await api.get('/articles');
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
