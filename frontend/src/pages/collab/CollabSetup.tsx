// 协同规划设置页面 - 填写必要信息后创建协同房间（毛玻璃风格）
// AI辅助生成：GLM-5, 2026-04-22
// 内容说明：添加封面图片上传功能、行程描述自定义功能、集成DoubleCalendar日历组件、添加调试日志
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Users, Sparkles, ArrowRight, CheckCircle, AlertCircle, Upload, Image as ImageIcon, X, Type as TypeIcon } from 'lucide-react';
import { message } from 'antd';
import GlassLayout from '../../components/layout/GlassLayout';
import { GlassCard } from '../../components/home';
import { createCollabRoom } from '../../api/collabApi';
import { API_BASE_URL } from '../../config/api';
import { DoubleCalendar } from '../../components/input/DoubleCalendar';
import ImageCropper from '../../components/media/ImageCropper';

interface FormData {
  roomName: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  tripDescription: string;
  coverImage: string;
}

export default function CollabSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    roomName: '',
    destination: '',
    startDate: '',
    endDate: '',
    groupSize: 2,
    tripDescription: '',
    coverImage: '',
  });

  // 图片上传状态
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 图片上传触发');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ 没有选择文件');
      return;
    }

    console.log('✅ 选择文件:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ 文件类型不支持:', file.type);
      message.error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('❌ 文件太大:', file.size);
      message.error('图片大小不能超过 10MB');
      return;
    }

    console.log('✅ 文件验证通过，打开裁剪器');
    // 打开裁剪器
    setSelectedFile(file);
    setCropperVisible(true);
  };

  // 处理裁剪确认
  const handleCropConfirm = async (croppedImage: string) => {
    console.log('📸 裁剪确认，开始上传');
    setUploading(true);
    try {
      // 将base64转换为Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      console.log('📦 准备上传文件:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // 上传裁剪后的图片
      const formData = new FormData();
      formData.append('image', file);

      console.log('🚀 发送上传请求到:', `${API_BASE_URL}/upload/image`);
      const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await uploadResponse.json();
      console.log('📝 上传响应:', result);

      if (result.success) {
        const imageUrl = result.data.url;
        console.log('✅ 图片上传成功，URL:', imageUrl);
        setFormData((prevFormData) => ({ ...prevFormData, coverImage: imageUrl }));
        setPreviewUrl(imageUrl);
        setCropperVisible(false);
        setSelectedFile(null);
        message.success('图片上传成功');
      } else {
        message.error(result.error || '图片上传失败');
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      message.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理裁剪取消
  const handleCropCancel = () => {
    setCropperVisible(false);
    setSelectedFile(null);
  };

  // 删除上传的图片
  const handleRemoveImage = () => {
    setFormData((prevFormData) => ({ ...prevFormData, coverImage: '' }));
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateStep1 = () => {
    if (!formData.roomName.trim()) {
      message.warning('请输入房间名称');
      return false;
    }
    if (!formData.destination.trim()) {
      message.warning('请输入目的地');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.startDate) {
      message.warning('请选择出发日期');
      return false;
    }
    if (!formData.endDate) {
      message.warning('请选择返回日期');
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      message.warning('返回日期必须晚于出发日期');
      return false;
    }
    if (formData.groupSize < 2) {
      message.warning('人数至少为2人');
      return false;
    }
    if (formData.groupSize > 20) {
      message.warning('人数最多为20人');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 创建空的行程数据
      const emptyTripData = {
        title: formData.roomName, // 使用用户输入的房间名称
        customization: {
          tripName: formData.roomName, // 使用用户输入的房间名称
          tripDescription: formData.tripDescription || `协同规划 - ${formData.destination}`,
          coverImage: formData.coverImage, // 添加封面图片
        },
        summary: {
          origin: '',
          destination: formData.destination,
          start_date: formData.startDate,
          end_date: formData.endDate,
          travelers: formData.groupSize,
          budget: 10000,
          preferences: []
        },
        itinerary: {
          itinerary: []
        },
        total_cost: 0,
        budget_breakdown: {
          transportation: 0,
          accommodation: 0,
          dining: 0,
          tickets: 0
        },
        hotel: null,
        hotelRecommendations: [],
        restaurantRecommendations: [],
        restaurants: []
      };

      // 调试日志：检查封面图片数据
      console.log('📝 准备创建协同行程，数据如下:');
      console.log('  - roomName:', formData.roomName);
      console.log('  - destination:', formData.destination);
      console.log('  - coverImage:', formData.coverImage);
      console.log('  - tripDescription:', formData.tripDescription);
      console.log('  - 完整数据:', JSON.stringify(emptyTripData, null, 2));

      // 使用apiClient创建行程
      const saveResponse = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emptyTripData),
      });

      const saveData = await saveResponse.json();

      console.log('📝 后端响应:', saveData);
      console.log('  - success:', saveData.success);
      console.log('  - tripId:', saveData.data?.tripId);
      if (saveData.data?.trip) {
        console.log('  - 保存的coverImage:', saveData.data.trip.coverImage);
      }

      if (!saveData.success) {
        throw new Error(saveData.error || '创建行程失败');
      }

      const tripId = saveData.data?.tripId;

      if (!tripId) {
        throw new Error('行程ID为空');
      }

      // 用新创建的行程ID创建协同房间
      const roomResponse = await createCollabRoom(tripId);

      if (roomResponse.success) {
        message.success('协同房间创建成功');
        // 进入房间
        const roomId = roomResponse.data.room?.id || roomResponse.data.id;
        navigate(`/collab/room/${roomId}`);
      } else {
        throw new Error(roomResponse.error || '创建协同房间失败');
      }
    } catch (error: any) {
      console.error('创建协同房间失败:', error);
      setError(error.response?.data?.error || error.message || '创建协同房间失败，请重试');
      message.error(error.response?.data?.error || error.message || '创建协同房间失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  return (
    <GlassLayout showSearch={false}>
      <div className="max-w-2xl mx-auto py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-livetrip-primary/20 mb-4">
            <Sparkles className="h-8 w-8 text-livetrip-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">创建协同规划房间</h1>
          <p className="text-white/60">填写必要信息，邀请朋友一起规划行程</p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-livetrip-primary' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-livetrip-primary text-white' : 'bg-white/10'}`}>
              1
            </div>
            <span className="font-medium">基本信息</span>
          </div>
          <div className={`w-12 h-0.5 transition-all ${step >= 2 ? 'bg-livetrip-primary' : 'bg-white/20'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-livetrip-primary' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-livetrip-primary text-white' : 'bg-white/10'}`}>
              2
            </div>
            <span className="font-medium">行程详情</span>
          </div>
        </div>

        <GlassCard className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {/* 房间名称 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  房间名称
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.roomName}
                    onChange={(e) => handleInputChange('roomName', e.target.value)}
                    placeholder="例如：北京三日游"
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-green-400/50 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] focus:outline-none"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-livetrip-primary/0 via-livetrip-primary/20 to-livetrip-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </div>

              {/* 目的地 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  <Navigation className="inline h-4 w-4 mr-2" />
                  目的地
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    placeholder="输入目的地城市（如：北京、上海、杭州）"
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-green-400/50 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] focus:outline-none"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-livetrip-primary/0 via-livetrip-primary/20 to-livetrip-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
                <p className="text-xs text-white/50 mt-2">目的地将用于获取该城市的景点信息</p>
              </div>

              {/* 下一步按钮 */}
              <button
                onClick={handleNext}
                className="relative w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-lg border border-white/20 shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2">
                  下一步
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* 日期选择 - 使用DoubleCalendar组件 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  选择行程日期
                </label>
                <DoubleCalendar
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  onStartDateChange={(date) => handleInputChange('startDate', date)}
                  onEndDateChange={(date) => handleInputChange('endDate', date)}
                />
              </div>



              {/* 人数选择 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  <Users className="inline h-4 w-4 mr-2" />
                  出行人数
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleInputChange('groupSize', Math.max(2, formData.groupSize - 1))}
                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={formData.groupSize}
                    onChange={(e) => handleInputChange('groupSize', parseInt(e.target.value) || 2)}
                    min={2}
                    max={20}
                    className="flex-1 px-6 py-5 text-lg text-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                  />
                  <button
                    onClick={() => handleInputChange('groupSize', Math.min(20, formData.groupSize + 1))}
                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-2">包括您在内，至少2人，最多20人</p>
              </div>

              {/* 行程描述 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  行程描述（可选）
                </label>
                <textarea
                  value={formData.tripDescription}
                  onChange={(e) => handleInputChange('tripDescription', e.target.value)}
                  placeholder="简要描述您的行程主题或备注..."
                  rows={3}
                  className="w-full px-5 py-3 text-base rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none resize-none"
                />
              </div>

              {/* 行程封面 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <ImageIcon className="inline h-4 w-4 mr-2" />
                  行程封面（可选）
                </label>

                {/* 封面预览 */}
                {(previewUrl || formData.coverImage) && (
                  <div className="mb-3 relative rounded-xl overflow-hidden">
                    <img
                      src={previewUrl || formData.coverImage}
                      alt="行程封面预览"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 上传按钮 */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        上传封面
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-1">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</p>
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handlePrev}
                  className="py-4 rounded-xl bg-white/10 text-white font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="relative py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-lg border border-white/20 shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        创建房间
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* 图片裁剪器 */}
      {cropperVisible && selectedFile && (
        <ImageCropper
          visible={cropperVisible}
          imageFile={selectedFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </GlassLayout>
  );
}


