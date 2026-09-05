import api from './api';

export const getArticles = async () => {
  const response = await api.get('/articles');
  return response.data;
};

let inFlightPublishedPromise: Promise<any> | null = null;
let cachedPublishedData: { data: any; expiresAt: number } | null = null;
const PUBLISHED_CACHE_TTL_MS = 30 * 1000; // 30s client-side cache

export const clearPublishedArticlesCache = () => {
  cachedPublishedData = null;
  inFlightPublishedPromise = null;
};

export const getPublishedArticles = async (forceRefresh = false) => {
  if (!forceRefresh && cachedPublishedData && cachedPublishedData.expiresAt > Date.now()) {
    return cachedPublishedData.data;
  }

  if (!forceRefresh && inFlightPublishedPromise) {
    return inFlightPublishedPromise;
  }

  inFlightPublishedPromise = api.get('/articles/published')
    .then((response) => {
      cachedPublishedData = {
        data: response.data,
        expiresAt: Date.now() + PUBLISHED_CACHE_TTL_MS
      };
      return response.data;
    })
    .finally(() => {
      inFlightPublishedPromise = null;
    });

  return inFlightPublishedPromise;
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

const pdfUrlCache: { [cacheKey: string]: { url: string; expiresAt: number } } = {};

export const getPdfUrl = async (articleId: string, key?: string) => {
  const urlPath = key ? `/articles/${articleId}/pdf?key=${encodeURIComponent(key)}` : `/articles/${articleId}/pdf`;
  const cacheKey = `pdf_${articleId}_${key || 'default'}`;
  const cached = pdfUrlCache[cacheKey];
  if (cached && cached.expiresAt > Date.now()) {
    return { success: true, pdfUrl: cached.url };
  }

  const response = await api.get(urlPath);
  if (response.data && response.data.success && response.data.pdfUrl) {
    pdfUrlCache[cacheKey] = {
      url: response.data.pdfUrl,
      expiresAt: Date.now() + 45 * 60 * 1000
    };
  }
  return response.data;
};

export const getPublicPdfUrl = async (articleId: string) => {
  const cacheKey = `pdf_public_${articleId}`;
  const cached = pdfUrlCache[cacheKey];
  if (cached && cached.expiresAt > Date.now()) {
    return { success: true, pdfUrl: cached.url };
  }

  const response = await api.get(`/articles/${articleId}/pdf-public`);
  if (response.data && response.data.success && response.data.pdfUrl) {
    pdfUrlCache[cacheKey] = {
      url: response.data.pdfUrl,
      expiresAt: Date.now() + 45 * 60 * 1000
    };
  }
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

export const assignReviewers = async (
  id: string,
  reviewerIds: string[],
  reviewerNames: string[],
  reviewDeadline?: string,
  reviewerNote?: string
) => {
  const response = await api.patch(`/articles/${id}/assign`, {
    reviewerIds,
    reviewerNames,
    reviewDeadline,
    reviewerNote
  });
  return response.data;
};

export const updateArticleStatus = async (
  id: string,
  status: string,
  extraData?: {
    rejectionReason?: string;
    adminNote?: string;
    remarks?: string;
    recommendation?: string;
    reviewedFile?: any;
  }
) => {
  if (extraData?.reviewedFile instanceof File) {
    const formData = new FormData();
    formData.append('status', status);
    if (extraData.rejectionReason) formData.append('rejectionReason', extraData.rejectionReason);
    if (extraData.adminNote) formData.append('adminNote', extraData.adminNote);
    if (extraData.remarks) formData.append('remarks', extraData.remarks);
    if (extraData.recommendation) formData.append('recommendation', extraData.recommendation);
    formData.append('reviewedFile', extraData.reviewedFile);

    const response = await api.patch(`/articles/${id}/status`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  const response = await api.patch(`/articles/${id}/status`, { status, ...extraData });
  return response.data;
};

export const bulkPublishArticles = async (
  articleIds: string[],
  metadata: { volumeNo: string; monthYear: string; issueNumber: number; issn?: string }
) => {
  const response = await api.patch('/articles/bulk-publish', { articleIds, ...metadata });
  return response.data;
};
