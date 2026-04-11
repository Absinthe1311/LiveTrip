// 图片裁剪组件 - 简化版，使用react-image-crop库
import { useState, useRef, useEffect } from 'react';
import ReactCrop, { PixelCrop } from 'react-image-crop';
import { Modal, Button } from 'antd';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  visible: boolean;
  imageFile: File | null;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ visible, imageFile, onConfirm, onCancel }: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [crop, setCrop] = useState<PixelCrop>({
    unit: 'px',
    x: 0,
    y: 0,
    width: 800,
    height: 450,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenAspectRatio, setScreenAspectRatio] = useState<number>(16 / 9);

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
      // 重置裁剪框到中心位置，根据屏幕比例设置初始大小
      const initialWidth = 800;
      const initialHeight = initialWidth / screenAspectRatio;
      setCrop({
        unit: 'px',
        x: 0,
        y: 0,
        width: initialWidth,
        height: initialHeight,
      });
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // 确认裁剪
  const handleConfirm = async () => {
    if (!canvasRef.current || !imageRef) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef;

    if (!ctx) return;

    // 设置画布大小为裁剪区域大小
    canvas.width = crop.width;
    canvas.height = crop.height;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 计算图片的缩放比例
    const scaleX = image.naturalWidth / (image.width || image.naturalWidth);
    const scaleY = image.naturalHeight / (image.height || image.naturalHeight);

    // 绘制裁剪后的图片
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    // 导出裁剪后的图片
    const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
    onConfirm(croppedImage);
  };

  // 处理裁剪框变化
  const handleCropChange = (crop: PixelCrop) => {
    setCrop(crop);
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
      <div style={{ minHeight: '600px' }}>
        <ReactCrop
          crop={crop}
          onChange={handleCropChange}
          onComplete={(c) => setCrop(c)}
          aspect={screenAspectRatio}
          minWidth={200}
          minHeight={200 / screenAspectRatio}
          keepSelection
        >
          <img
            ref={(element) => {
              if (element) {
                setImageRef(element);
              }
            }}
            src={imageUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              objectFit: 'contain',
            }}
          />
        </ReactCrop>
      </div>

      {/* 隐藏的Canvas用于生成裁剪后的图片 */}
      <canvas ref={canvasRef} className="hidden" />
    </Modal>
  );
}
