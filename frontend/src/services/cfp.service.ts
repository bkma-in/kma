import api from './api';
import type { CallForPaper, QueueStats, PublishCFPOptions, RecipientEstimateResponse } from '../types/cfp';

export interface CFPFilterParams {
  status?: string;
  year?: string;
  volume?: string;
  issue?: string;
  topic?: string;
  search?: string;
}

export const getCFPs = async (params?: CFPFilterParams) => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.year) queryParams.append('year', params.year);
  if (params?.volume) queryParams.append('volume', params.volume);
  if (params?.issue) queryParams.append('issue', params.issue);
  if (params?.topic) queryParams.append('topic', params.topic);
  if (params?.search) queryParams.append('search', params.search);

  const response = await api.get<{ success: boolean; cfps: CallForPaper[] }>(`/cfp?${queryParams.toString()}`);
  return response.data;
};

export const getCFPById = async (id: string) => {
  const response = await api.get<{ success: boolean; cfp: CallForPaper }>(`/cfp/${id}`);
  return response.data;
};

export const createCFP = async (formData: FormData) => {
  const response = await api.post<{ success: boolean; cfp: CallForPaper }>('/cfp', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateCFP = async (id: string, formData: FormData) => {
  const response = await api.put<{ success: boolean; cfp: CallForPaper }>(`/cfp/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const estimateRecipients = async (roles: { authors: boolean; readers: boolean; reviewers: boolean; subscribers: boolean }) => {
  const response = await api.post<RecipientEstimateResponse>('/cfp/estimate-recipients', roles);
  return response.data;
};

export const publishCFP = async (id: string, options: PublishCFPOptions) => {
  const response = await api.post<{
    success: boolean;
    message: string;
    inAppNotificationsSent: number;
    emailsQueued: number;
    campaignId: string;
  }>(`/cfp/${id}/publish`, options);
  return response.data;
};

export const unpublishCFP = async (id: string) => {
  const response = await api.post<{ success: boolean; message: string }>(`/cfp/${id}/unpublish`);
  return response.data;
};

export const archiveCFP = async (id: string) => {
  const response = await api.post<{ success: boolean; message: string }>(`/cfp/${id}/archive`);
  return response.data;
};

export const duplicateCFP = async (id: string) => {
  const response = await api.post<{ success: boolean; cfp: CallForPaper }>(`/cfp/${id}/duplicate`);
  return response.data;
};

export const deleteCFP = async (id: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(`/cfp/${id}`);
  return response.data;
};

export const getQueueStats = async (cfpId?: string) => {
  const url = cfpId ? `/cfp/queue/stats?cfpId=${cfpId}` : '/cfp/queue/stats';
  const response = await api.get<{ success: boolean; stats: QueueStats }>(url);
  return response.data;
};

export const retryFailedQueue = async (cfpId?: string) => {
  const response = await api.post<{ success: boolean; resetCount: number; message: string }>('/cfp/queue/retry', { cfpId });
  return response.data;
};

export const cancelPendingQueue = async (cfpId?: string) => {
  const response = await api.post<{ success: boolean; cancelledCount: number; message: string }>('/cfp/queue/cancel', { cfpId });
  return response.data;
};
