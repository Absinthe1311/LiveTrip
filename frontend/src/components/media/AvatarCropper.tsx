/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 头像裁剪组件 - 使用正方形裁剪框
import { useState, useRef, useEffect, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Modal, Button, Slider } from 'antd';

interface AvatarCropperProps {
  visible: boolean;
  imageFile: File | null;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function AvatarCropper({
  visible,
  imageFile,
  onConfirm,
  onCancel,
}: AvatarCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // 当图片文件变化时，加载图片
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);

      // 重置状态
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // 处理裁剪完成
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 确认裁剪
  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageUrl) return;

    try {
      // 创建图片元素
      const image = new window.Image();
      image.src = imageUrl;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      // 创建canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // 设置canvas大小为裁剪区域大小（正方形）
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // 绘制裁剪后的图片
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // 导出裁剪后的图片（高质量）
      const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
      onConfirm(croppedImage);
    } catch (error) {
      console.error('裁剪图片失败:', error);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确认
        </Button>,
      ]}
      width={600}
      title="裁剪头像"
    >
      <div className="relative w-full h-[400px] bg-black">
        {imageUrl && (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1} // 正方形比例 1:1
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            cropShape="round" // 圆形裁剪框，适合头像
            showGrid={true}
            restrictPosition={true}
          />
        )}
      </div>

      {/* 缩放控制 */}
      <div className="mt-4 px-4">
        <div className="text-sm text-gray-600 mb-2">缩放</div>
        <Slider value={zoom} min={1} max={3} step={0.1} onChange={setZoom} />
      </div>
    </Modal>
  );
}
