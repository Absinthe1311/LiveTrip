// AI辅助生成：GLM-5, 2026-04-24 21:31
// 描述：简单的预算调整弹窗组件，用于调整总预算金额，不包含历史查看功能

import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { adjustBudget } from '../../api/client';

interface SimpleBudgetAdjustModalProps {
  visible: boolean;
  tripId: string;
  currentBudget: number;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function SimpleBudgetAdjustModal({
  visible,
  tripId,
  currentBudget,
  onClose,
  onUpdate,
}: SimpleBudgetAdjustModalProps) {
  const [newBudget, setNewBudget] = useState(currentBudget.toString());
  const [loading, setLoading] = useState(false);

  const handleAdjust = async () => {
    const budget = parseFloat(newBudget);
    if (isNaN(budget) || budget < 0) {
      message.error('请输入有效的预算金额');
      return;
    }

    if (budget === currentBudget) {
      message.warning('预算金额未改变');
      return;
    }

    setLoading(true);
    try {
      const response = await adjustBudget(
        tripId,
        budget,
        `调整总预算从¥${currentBudget}到¥${budget}`
      );
      if (response.success) {
        message.success('预算调整成功');
        onUpdate?.();
        onClose();
      } else {
        message.error(response.message || '调整失败');
      }
    } catch (error) {
      console.error('调整预算失败:', error);
      message.error('调整预算失败');
    } finally {
      setLoading(false);
    }
  };

  const difference = parseFloat(newBudget) - currentBudget;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-500" />
          <span>调整总预算</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleAdjust}
      okText="确认调整"
      cancelText="取消"
      confirmLoading={loading}
      width={400}
    >
      <div className="space-y-4 py-4">
        {/* 当前预算 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-500 mb-1">当前总预算</div>
          <div className="text-2xl font-bold text-gray-800">¥{currentBudget.toFixed(0)}</div>
        </div>

        {/* 新预算输入 */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">新的总预算金额</label>
          <Input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            placeholder="请输入新的预算金额"
            prefix="¥"
            size="large"
          />
        </div>

        {/* 变化提示 */}
        {!isNaN(parseFloat(newBudget)) && parseFloat(newBudget) !== currentBudget && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              difference > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {difference > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm">
              预算将{difference > 0 ? '增加' : '减少'} ¥{Math.abs(difference).toFixed(0)}
            </span>
          </div>
        )}

        {/* 提示信息 */}
        <div className="text-xs text-gray-400">
          💡 提示：调整总预算不会影响已记录的开支，只会改变预算上限
        </div>
      </div>
    </Modal>
  );
}
