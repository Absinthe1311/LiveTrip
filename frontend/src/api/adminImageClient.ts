import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

/**
 * 管理员图片API客户端
 */
export const adminImageClient = {
  /**
   * 获取仪表板统计数据
   */
  async getDashboardStats() {
    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/stats`);
    return response.data;
  },

  /**
   * 获取景点配图状态列表
   */
  async getSpotImageStatus(params?: {
    status?: string;
    keyword?: string;
    city?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await axios.get(`${API_BASE_URL}/admin/spots/image-status`, { params });
    return response.data;
  },

  /**
   * 上传景点图片
   */
  async uploadSpotImage(spotId: string, formData: FormData) {
    const response = await axios.post(
      `${API_BASE_URL}/admin/spots/${spotId}/upload-images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 获取景点图片列表
   */
  async getSpotImages(spotId: string) {
    const response = await axios.get(`${API_BASE_URL}/admin/spots/${spotId}/images`);
    return response.data;
  },

  /**
   * 删除景点图片
   */
  async deleteSpotImage(imageId: string) {
    const response = await axios.delete(`${API_BASE_URL}/admin/images/${imageId}`);
    return response.data;
  },

  /**
   * 设置主图
   */
  async setPrimaryImage(spotId: string, imageId: string) {
    const response = await axios.put(`${API_BASE_URL}/admin/spots/${spotId}/set-primary/${imageId}`);
    return response.data;
  },

  /**
   * 获取用户行程景点
   */
  async getUserTripSpots(params?: {
    page?: number;
    limit?: number;
  }) {
    const response = await axios.get(`${API_BASE_URL}/admin/spots/from-user-trips`, { params });
    return response.data;
  },
};
