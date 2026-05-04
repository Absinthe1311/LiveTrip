// 管理员模块类型定义

// 景点列表项
export interface AdminSpotListItem {
  id: string;
  name: string;
  city: string;
  approvedImageCount: number;
  pendingImageCount: number;
  coverImageUrl: string | null;
}

// 景点列表响应
export interface AdminSpotListResponse {
  items: AdminSpotListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 景点图片项
export interface SpotImageItem {
  id: string;
  cloudinaryUrl: string;
  cloudinaryId: string;
  source: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  uploaderName: string | null;
  createdAt: string;
}

// 景点图片列表响应
export interface SpotImagesResponse {
  approved: SpotImageItem[];
  pending: SpotImageItem[];
  rejected: SpotImageItem[];
}

// 待审核图片项
export interface PendingImageItem {
  id: string;
  cloudinaryUrl: string;
  spotId: string;
  spotName: string;
  uploaderName: string;
  uploaderEmail: string;
  createdAt: string;
}

// 待审核图片列表响应
export interface PendingImagesResponse {
  items: PendingImageItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 上传图片响应
export interface imgUploadResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    url: string;
  };
}
