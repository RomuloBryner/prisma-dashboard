/**
 * Cliente API para comunicación con el backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos para videos
export interface VideoMetadata {
  id: string;
  url: string;
  name?: string;
  priority?: number;
}

export interface VideoCreate {
  url: string;
  name?: string;
  priority?: number;
}

export interface VideoUpdate {
  url?: string;
  name?: string;
  priority?: number;
}

// Tipos para upload de videos a S3
export interface UploadUrlRequest {
  contentType: string;
  sizeMB: number;
  extension: string;
}

export interface UploadUrlResponse {
  upload: {
    url: string;
    fields: Record<string, string>;
  };
  videoId: string;
  s3Key: string;
}

export interface ConfirmVideoRequest {
  videoId: string;
  s3Key: string;
  name?: string;
  priority?: number;
}

export interface ConfirmVideoResponse {
  status: string;
  videoId: string;
  s3Key: string;
  url: string;
  etag?: string;
}

// Tipos para menú
export interface StoreItem {
  name: string;
  description: string;
  location: string;
  category?: string;
  image?: string;
}

export interface MenuItemCreate {
  name: string;
  description: string;
  location: string;
  category?: string;
  image?: string;
}

export interface MenuItemUpdate {
  name?: string;
  description?: string;
  location?: string;
  category?: string;
  image?: string;
}

export interface CategoryContent {
  title: string;
  items: StoreItem[];
}

export interface MenuContent {
  categories: Record<string, CategoryContent>;
}

// API de Videos
export const videosApi = {
  getAll: async (): Promise<VideoMetadata[]> => {
    const response = await apiClient.get<VideoMetadata[]>('/api/videos');
    return response.data;
  },

  getById: async (id: string): Promise<VideoMetadata> => {
    const response = await apiClient.get<VideoMetadata>(`/api/videos/${id}`);
    return response.data;
  },

  create: async (video: VideoCreate): Promise<VideoMetadata> => {
    const response = await apiClient.post<VideoMetadata>('/api/videos', video);
    return response.data;
  },

  getUploadUrl: async (request: UploadUrlRequest): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<UploadUrlResponse>('/api/videos/upload-url', request);
    return response.data;
  },

  confirmVideo: async (request: ConfirmVideoRequest): Promise<ConfirmVideoResponse> => {
    const response = await apiClient.post<ConfirmVideoResponse>('/api/videos/confirm', request);
    return response.data;
  },

  update: async (id: string, video: VideoUpdate): Promise<VideoMetadata> => {
    const response = await apiClient.put<VideoMetadata>(`/api/videos/${id}`, video);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/videos/${id}`);
  },
};

// API de Menú
export const menuApi = {
  getMenu: async (): Promise<MenuContent> => {
    const response = await apiClient.get<MenuContent>('/api/menu/categories');
    return response.data;
  },

  getMainItems: async (): Promise<{ mainMenuItems: any[] }> => {
    const response = await apiClient.get<{ mainMenuItems: any[] }>('/api/menu/main-items');
    return response.data;
  },

  getCategory: async (categoryId: string): Promise<CategoryContent> => {
    const response = await apiClient.get<CategoryContent>(`/api/menu/categories/${categoryId}`);
    return response.data;
  },

  addItem: async (categoryId: string, item: MenuItemCreate): Promise<CategoryContent> => {
    const response = await apiClient.post<CategoryContent>(
      `/api/menu/categories/${categoryId}/items`,
      item
    );
    return response.data;
  },

  updateItem: async (
    categoryId: string,
    itemIndex: number,
    item: MenuItemUpdate
  ): Promise<CategoryContent> => {
    const response = await apiClient.put<CategoryContent>(
      `/api/menu/categories/${categoryId}/items/${itemIndex}`,
      item
    );
    return response.data;
  },

  deleteItem: async (categoryId: string, itemIndex: number): Promise<CategoryContent> => {
    const response = await apiClient.delete<CategoryContent>(
      `/api/menu/categories/${categoryId}/items/${itemIndex}`
    );
    return response.data;
  },
};

// API de Sincronización
export const syncApi = {
  syncVideos: async (): Promise<{ status: string; message: string; videos_count?: number }> => {
    const response = await apiClient.post('/api/sync/videos');
    return response.data;
  },

  syncMenu: async (): Promise<{ status: string; message: string; menu?: MenuContent }> => {
    const response = await apiClient.post('/api/sync/menu');
    return response.data;
  },
};
