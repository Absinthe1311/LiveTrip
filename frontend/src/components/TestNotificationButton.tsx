// 测试通知按钮 - 用于测试IoT通知功能
import { useState } from 'react';
import { TestTube } from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';

interface TestNotificationButtonProps {
  onTestComplete?: () => void;
}

export function TestNotificationButton({ onTestComplete }: TestNotificationButtonProps) {
  const [loading, setLoading] = useState(false);

  const sendTestNotification = async (type: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/notifications/test', { type });
      
      if (response.data.success) {
        toast.success('测试通知已发送', {
          description: response.data.data.content,
        });
        onTestComplete?.();
      }
    } catch (error) {
      console.error('发送测试通知失败:', error);
      toast.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  const sendBatchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/notifications/test-batch');
      
      if (response.data.success) {
        toast.success('批量测试通知已发送', {
          description: `已发送 ${response.data.data.count} 条通知`,
        });
        onTestComplete?.();
      }
    } catch (error) {
      console.error('发送批量测试通知失败:', error);
      toast.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 单个测试通知 */}
      <button
        onClick={() => sendTestNotification('rain')}
        disabled={loading}
        className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
        title="测试降雨通知"
      >
        <TestTube className="w-4 h-4 text-amber-400" />
      </button>

      {/* 批量测试通知 */}
      <button
        onClick={sendBatchNotifications}
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-xs text-blue-300"
        title="批量测试通知"
      >
        批量测试
      </button>
    </div>
  );
}
