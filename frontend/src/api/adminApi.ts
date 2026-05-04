/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：代码重构
 */

// 管理员 API 客户端 - 复用现有 axios 实例
import { apiClient } from './client';
import type {
  AdminSpotListResponse,
  SpotImagesResponse,
  PendingImagesResponse,
  UploadImageResponse,
} from '../types/admin';

/**
 * 获取管理员景点列表
 */
export async function getAdminSpots(
  page: number,
  pageSize: number
): Promise<{ success: boolean; data: AdminSpotListResponse; message?: string }> {
  const response = await apiClient.get('/admin/spots', {
    params: { page, pageSize },
  });
  return response.data;
}

/**
 * 获取景点图片列表
 */
export async function getSpotImages(
  spotId: string
): Promise<{ success: boolean; data: SpotImagesResponse; message?: string }> {
  const response = await apiClient.get(`/admin/spots/${spotId}/images`);
  return response.data;
}

/**
 * 审核图片
 */
export async function reviewImage(
  imageId: string,
  action: 'approve' | 'reject',
  note?: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.put(`/admin/images/${imageId}/review`, {
    action,
    note,
  });
  return response.data;
}

/**
 * 删除图片
 */
export async function deleteAdminImage(
  imageId: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/admin/images/${imageId}`);
  return response.data;
}

/**
 * 获取待审核图片列表
 */
export async function getPendingImages(
  page: number,
  pageSize: number
): Promise<{ success: boolean; data: PendingImagesResponse; message?: string }> {
  const response = await apiClient.get('/admin/images/pending', {
    params: { page, pageSize },
  });
  return response.data;
}

/**
 * 上传景点图片（管理员专用，自动审核通过）
 */
export async function uploadAdminImage(spotId: string, file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('images', file); // 注意：后端期望的字段名是 'images'

  const response = await apiClient.post(`/admin/spots/${spotId}/upload-images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
