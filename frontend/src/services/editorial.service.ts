import api from './api';
import type { 
  EditorMember, 
  EditorialPolicy, 
  EditorialBoardResponse, 
  AdminEditorialBoardResponse 
} from '../types/editorial';

let cachedBoardData: EditorialBoardResponse | null = null;
let cachedBoardPromise: Promise<EditorialBoardResponse> | null = null;

/**
 * Public: Get active editorial board grouped by category and current policy
 */
export const getEditorialBoard = async (forceRefresh = false): Promise<EditorialBoardResponse> => {
  if (!forceRefresh && cachedBoardData) {
    return cachedBoardData;
  }

  if (!forceRefresh && cachedBoardPromise) {
    return cachedBoardPromise;
  }

  cachedBoardPromise = api.get('/editorial/board')
    .then(res => {
      if (res.data && res.data.success) {
        cachedBoardData = res.data;
      }
      return res.data;
    })
    .catch(err => {
      cachedBoardPromise = null;
      throw err;
    });

  return cachedBoardPromise;
};

export const clearEditorialBoardCache = () => {
  cachedBoardData = null;
  cachedBoardPromise = null;
};

/**
 * Admin: Get all editors (active + inactive) + policy
 */
export const getAdminEditorialBoard = async (): Promise<AdminEditorialBoardResponse> => {
  const response = await api.get('/editorial/admin/board');
  return response.data;
};

/**
 * Admin: Create a new editor
 */
export const createEditor = async (editorData: Partial<EditorMember>) => {
  const response = await api.post('/editorial/admin/editors', editorData);
  clearEditorialBoardCache();
  return response.data;
};

/**
 * Admin: Update editor details
 */
export const updateEditor = async (id: string, editorData: Partial<EditorMember>) => {
  const response = await api.put(`/editorial/admin/editors/${id}`, editorData);
  clearEditorialBoardCache();
  return response.data;
};

/**
 * Admin: Toggle editor active status
 */
export const toggleEditorStatus = async (id: string, isActive: boolean) => {
  const response = await api.patch(`/editorial/admin/editors/${id}/status`, { isActive });
  clearEditorialBoardCache();
  return response.data;
};

/**
 * Admin: Delete an editor
 */
export const deleteEditor = async (id: string) => {
  const response = await api.delete(`/editorial/admin/editors/${id}`);
  clearEditorialBoardCache();
  return response.data;
};

/**
 * Admin: Batch reorder editors
 */
export const reorderEditors = async (items: { id: string; order: number }[]) => {
  const response = await api.put('/editorial/admin/reorder', { items });
  clearEditorialBoardCache();
  return response.data;
};

/**
 * Public: Get editorial policy
 */
export const getEditorialPolicy = async () => {
  const response = await api.get('/editorial/policy');
  return response.data;
};

/**
 * Admin: Update editorial policy
 */
export const updateEditorialPolicy = async (policyData: Partial<EditorialPolicy>) => {
  const response = await api.put('/editorial/admin/policy', policyData);
  clearEditorialBoardCache();
  return response.data;
};

/**
 * Admin: Reset Editorial Policy only to defaults
 */
export const resetEditorialPolicy = async () => {
  const response = await api.post('/editorial/admin/reset-policy');
  clearEditorialBoardCache();
  return response.data;
};

/**
 * Admin: Reset / Force re-seed default editorial board
 */
export const seedDefaultEditorialBoard = async () => {
  const response = await api.post('/editorial/admin/seed-defaults');
  clearEditorialBoardCache();
  return response.data;
};
