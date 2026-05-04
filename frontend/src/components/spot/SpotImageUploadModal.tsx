import React, { useState, useRef } from 'react';
import { Modal, Upload, Button, message, Image, Progress } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { AttractionItem } from '../../api/client';
import { API_BASE_URL } from '../../config/api';

interface SpotImageUploadModalProps {
  visible: boolean;
  spot: AttractionItem | null;
  tripId: string;
  city?: string; // 添加城市参数
  onClose: () => void;
  onSuccess: () => void;
}

export default function SpotImageUploadModal({
  visible,
  spot,
  tripId,
  city,
  onClose,
  onSuccess,
}: SpotImageUploadModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadFile[] = Array.from(files).map((file) => ({
      uid: `${Date.now()}-${file.name}`,
      name: file.name,
      status: 'done' as const,
      originFileObj: file as any,
      thumbUrl: URL.createObjectURL(file),
    }));

    setFileList((prev) => [...prev, ...newFiles].slice(0, 5)); // 最多5张
  };

  // 删除图片
  const handleRemove = (uid: string) => {
    setFileList((prev) => prev.filter((f) => f.uid !== uid));
  };

  // 上传图片
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择图片');
      return;
    }

    if (!spot) {
      message.error('景点信息缺失');
      return;
    }

    // 检查用户是否登录
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('请先登录后再上传图片');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // 使用spotId字段
    let spotId: string | null = spot.spotId || null;

    if (spotId) {
      console.log(`✅ 使用已存储的景点ID: ${spot.name} -> ${spotId}`);
    } else {
      // 如果没有spotId，则通过景点名称查找
      if (!city) {
        message.error('缺少城市信息，无法上传图片');
        setUploading(false);
        return;
      }

      try {
        console.log(`🔍 查找景点ID: ${spot.name} (${city})`);
        const apiBaseUrl = API_BASE_URL;
        const searchResponse = await fetch(`${apiBaseUrl}/spots/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: spot.name,
            city: city,
          }),
        });
        const searchData = await searchResponse.json();
        if (searchData.success && searchData.data && searchData.data.id) {
          spotId = searchData.data.id;
          console.log(`✅ 找到景点ID: ${spot.name} -> ${spotId}`);
        } else if (searchData.data && searchData.data.id) {
          spotId = searchData.data.id;
          console.log(`✅ 找到景点ID: ${spot.name} -> ${spotId}`);
        }
      } catch (error) {
        console.error('查找景点 ID 失败:', error);
      }
    }

    if (!spotId) {
      message.error('未找到对应的景点，无法上传图片');
      setUploading(false);
      return;
    }

    const totalFiles = fileList.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const fileItem = fileList[i];
      if (!fileItem.originFileObj) continue;

      try {
        const formData = new FormData();
        formData.append('file', fileItem.originFileObj);
        formData.append('spotId', spotId); // 使用景点 ID

        // 获取token
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const apiBaseUrl = API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/images/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
        } else {
          console.error('上传失败:', result.message);
          failCount++;
        }
      } catch (error) {
        console.error('上传失败:', error);
        failCount++;
      }

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setUploading(false);

    if (successCount > 0) {
      message.success(
        `成功上传 ${successCount} 张图片${failCount > 0 ? `，${failCount} 张失败` : ''}`
      );
      onSuccess();
      setFileList([]);
      onClose();
    } else {
      message.error('所有图片上传失败');
    }
  };

  // 关闭时重置
  const handleClose = () => {
    setFileList([]);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Modal
      title={`上传景点图片 - ${spot?.name || '未知景点'}`}
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={uploading}>
          取消
        </Button>,
        <Button key="upload" type="primary" loading={uploading} onClick={handleUpload}>
          上传 {fileList.length > 0 && `(${fileList.length})`}
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: '#666', marginBottom: 8 }}>
          上传您在景点拍摄的照片，审核通过后将展示在景点详情中。最多可上传5张图片。
        </p>
        <p style={{ color: '#999', fontSize: 12 }}>支持 JPG、PNG 格式，单张图片不超过 20MB</p>
      </div>

      {/* 图片预览列表 */}
      {fileList.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {fileList.map((file) => (
              <div
                key={file.uid}
                style={{
                  position: 'relative',
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #d9d9d9',
                }}
              >
                <Image
                  src={file.thumbUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  preview={false}
                />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(file.uid)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上传进度 */}
      {uploading && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={uploadProgress} status="active" />
        </div>
      )}

      {/* 选择图片按钮 */}
      {fileList.length < 5 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '1px dashed #d9d9d9',
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1890ff')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
        >
          <PlusOutlined style={{ fontSize: 32, color: '#999' }} />
          <p style={{ marginTop: 8, color: '#666' }}>点击选择图片</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Modal>
  );
}
