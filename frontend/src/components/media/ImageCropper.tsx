/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 图片裁剪组件 - 使用 react-easy-crop 库，完美适配屏幕比例
import { useState, useRef, useEffect, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Modal, Button } from 'antd';

interface ImageCropperProps {
  visible: boolean;
  imageFile: File | null;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  visible,
  imageFile,
  onConfirm,
  onCancel,
}: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [screenAspectRatio, setScreenAspectRatio] = useState<number>(16 / 9);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  // 计算屏幕比例
  useEffect(() => {
    const updateScreenRatio = () => {
      const ratio = window.innerWidth / window.innerHeight;
      setScreenAspectRatio(ratio);
    };

    updateScreenRatio();
    window.addEventListener('resize', updateScreenRatio);

    return () => window.removeEventListener('resize', updateScreenRatio);
  }, []);

  // 当图片文件变化时，加载图片
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);

      // 重置状态
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      // 获取图片自然尺寸
      const img = new window.Image();
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;

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

      // 设置canvas大小为裁剪区域大小
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
      console.error('裁剪失败:', error);
    }
  };

  return (
    <Modal
      title="裁剪背景图"
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确认使用
        </Button>,
      ]}
    >
      <div style={{ minHeight: '600px', position: 'relative' }}>
        {imageUrl && (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={screenAspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{
              containerStyle: {
                position: 'relative',
                width: '100%',
                height: '500px',
                background: '#1a1a1a',
              },
              mediaStyle: {
                // 让图片完整显示，不裁剪
              },
              cropAreaStyle: {
                // 裁剪区域样式
              },
            }}
            // 限制缩放范围
            restrictPosition={false}
            showGrid={true}
            zoomSpeed={0.1}
            minZoom={0.1}
            maxZoom={3}
          />
        )}
      </div>

      {/* 缩放控制 */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>缩放:</span>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: '14px', color: '#666', minWidth: '40px' }}>
          {zoom.toFixed(1)}x
        </span>
      </div>

      {/* 提示信息 */}
      <div
        style={{ marginTop: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
          💡 提示：裁剪框比例已自动适配您的屏幕比例（{screenAspectRatio.toFixed(2)}
          :1），裁剪后的图片将完美铺满背景。
        </p>
      </div>
    </Modal>
  );
}
