/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */
﻿// 用户信息编辑弹窗
import React, { useState, useEffect } from 'react';
import { X, Camera, User, Mail, FileText } from 'lucide-react';
import { message } from 'antd';
import AvatarCropper from '../media/AvatarCropper';
import { API_BASE_URL } from '../../config/api';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  nickname?: string;
  gender?: string;
  bio?: string;
  totalTrips?: number;
  totalCities?: number;
  completedTrips?: number;
}

interface UserProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdate: () => void;
}

const UserProfileEditModal: React.FC<UserProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdate,
}) => {
  const [nickname, setNickname] = useState(profile.nickname || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNickname(profile.nickname || '');
    setGender(profile.gender || '');
    setBio(profile.bio || '');
    setAvatar(profile.avatar || '');
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      message.error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('图片大小不能超过 5MB');
      return;
    }

    setSelectedFile(file);
    setCropperVisible(true);
  };

  const handleCropConfirm = async (croppedImage: string) => {
    setUploading(true);
    try {
      // 将base64转换为Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      // 上传头像
      const formData = new FormData();
      formData.append('file', file); // 修改为 'file'，与后端中间件一致

      const uploadResponse = await fetch(`${API_BASE_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await uploadResponse.json();

      if (result.success) {
        setAvatar(result.data.url);
        message.success('头像上传成功');
        setCropperVisible(false);
        setSelectedFile(null);
      } else {
        message.error(result.message || '头像上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      message.error('头像上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          nickname,
          gender,
          bio,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('用户信息更新成功');
        onUpdate();
        onClose();
      } else {
        message.error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      message.error('更新失败，请重试');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">编辑个人资料</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* 头像上传 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                onClick={handleAvatarClick}
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer hover:border-amber-400/50 transition-colors"
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg hover:bg-amber-600 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* 表单 */}
          <div className="space-y-4">
            {/* 昵称 */}
            <div>
              <label className="block text-sm text-white/60 mb-2">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>

            {/* 性别 */}
            <div>
              <label className="block text-sm text-white/60 mb-2">性别</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-amber-400/50 focus:outline-none transition-colors"
              >
                <option value="" className="bg-gray-800">
                  请选择
                </option>
                <option value="男" className="bg-gray-800">
                  男
                </option>
                <option value="女" className="bg-gray-800">
                  女
                </option>
                <option value="保密" className="bg-gray-800">
                  保密
                </option>
              </select>
            </div>

            {/* 个性签名 */}
            <div>
              <label className="block text-sm text-white/60 mb-2">个性签名</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="写点什么介绍一下自己吧..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* 图片裁剪器 */}
      {cropperVisible && selectedFile && (
        <AvatarCropper
          visible={cropperVisible}
          imageFile={selectedFile}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setCropperVisible(false);
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
};

export default UserProfileEditModal;
