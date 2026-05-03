// AI辅助生成：GLM-5, 2026-04-24 21:31
// 描述：预算详情弹窗组件，显示行程的预算使用情况、各分类明细，支持调整预算

import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';
import {
  Wallet,
  Building2,
  Utensils,
  Ticket,
  Car,
  ShoppingBag,
  History,
  Edit2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { getBudgetStatus, adjustBudget, getBudgetHistory } from '../../api/client';

interface BudgetDetailModalProps {
  visible: boolean;
  tripId: string;
  tripTitle: string;
  onClose: () => void;
  onUpdate?: () => void;
}

interface BudgetInfo {
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  usageRate: number;
  budgetStatus: string;
  breakdown: {
    transportation: number;
    accommodation: number;
    dining: number;
    tickets: number;
    shopping: number;
    other: number;
  } | null;
}

interface BudgetRecord {
  id: string;
  changeType: string;
  category: string | null;
  previousAmount: number;
  newAmount: number;
  difference: number;
  description: string;
  relatedItemName: string | null;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  createdAt: string;
}

export default function BudgetDetailModal({
  visible,
  tripId,
  tripTitle,
  onClose,
  onUpdate,
}: BudgetDetailModalProps) {
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [history, setHistory] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    if (visible && tripId) {
      loadBudgetInfo();
    }
  }, [visible, tripId]);

  const loadBudgetInfo = async () => {
    setLoading(true);
    try {
      const response = await getBudgetStatus(tripId);
      if (response.success) {
        setBudgetInfo(response.data);
      }
    } catch (error) {
      console.error('加载预算信息失败:', error);
      message.error('加载预算信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await getBudgetHistory(tripId, 10);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('加载预算历史失败:', error);
    }
  };

  const handleAdjustBudget = async () => {
    const budget = parseFloat(newBudget);
    if (isNaN(budget) || budget < 0) {
      message.error('请输入有效的预算金额');
      return;
    }

    try {
      const response = await adjustBudget(tripId, budget, adjustReason || '调整总预算');
      if (response.success) {
        message.success('预算调整成功');
        setShowAdjustModal(false);
        setNewBudget('');
        setAdjustReason('');
        loadBudgetInfo();
        onUpdate?.();
      } else {
        message.error(response.message || '调整失败');
      }
    } catch (error) {
      console.error('调整预算失败:', error);
      message.error('调整预算失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over_budget':
        return 'text-red-500';
      case 'on_budget':
        return 'text-orange-500';
      default:
        return 'text-green-500';
    }
  };

  const getUsageBarColor = (rate: number) => {
    if (rate > 1.0) return 'bg-red-500';
    if (rate >= 0.95) return 'bg-orange-500';
    if (rate >= 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transportation':
        return <Car className="h-4 w-4" />;
      case 'accommodation':
        return <Building2 className="h-4 w-4" />;
      case 'dining':
        return <Utensils className="h-4 w-4" />;
      case 'tickets':
        return <Ticket className="h-4 w-4" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      transportation: '交通',
      accommodation: '住宿',
      dining: '餐饮',
      tickets: '门票',
      shopping: '购物',
      other: '其他',
    };
    return names[category] || category;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            <span>{tripTitle} - 预算详情</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : budgetInfo ? (
          <div className="space-y-4">
            {/* 预算概览 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-sm text-gray-500">总预算</div>
                  <div className="text-2xl font-bold">¥{budgetInfo.totalBudget.toFixed(0)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">已使用</div>
                  <div className={`text-2xl font-bold ${getStatusColor(budgetInfo.budgetStatus)}`}>
                    ¥{budgetInfo.usedBudget.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* 使用进度条 */}
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>使用率 {(budgetInfo.usageRate * 100).toFixed(1)}%</span>
                  <span>剩余 ¥{budgetInfo.remainingBudget.toFixed(0)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getUsageBarColor(budgetInfo.usageRate)} transition-all duration-300`}
                    style={{ width: `${Math.min(budgetInfo.usageRate * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 分类明细 */}
            {budgetInfo.breakdown && (
              <div>
                <h4 className="font-semibold mb-2">预算明细</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(budgetInfo.breakdown).map(([key, value]) => {
                    if (value === 0) return null;
                    return (
                      <div key={key} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                        <div className="text-blue-500">{getCategoryIcon(key)}</div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">{getCategoryName(key)}</div>
                          <div className="font-semibold">¥{value.toFixed(0)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNewBudget(budgetInfo.totalBudget.toString());
                  setShowAdjustModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Edit2 className="h-4 w-4" />
                调整预算
              </button>
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) {
                    loadHistory();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <History className="h-4 w-4" />
                {showHistory ? '隐藏历史' : '查看历史'}
              </button>
            </div>

            {/* 变更历史 */}
            {showHistory && (
              <div>
                <h4 className="font-semibold mb-2">变更历史</h4>
                {history.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">暂无变更记录</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {history.map((record) => (
                      <div key={record.id} className="bg-gray-50 rounded p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1">
                            {record.difference > 0 ? (
                              <TrendingUp className="h-3 w-3 text-red-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-green-500" />
                            )}
                            <span className="text-gray-600">{record.description}</span>
                          </div>
                          <span className="text-gray-400 text-xs">
                            {formatTime(record.createdAt)}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          ¥{record.previousAmount.toFixed(0)} → ¥{record.newAmount.toFixed(0)}
                          <span
                            className={record.difference > 0 ? 'text-red-500' : 'text-green-500'}
                          >
                            {' '}
                            ({record.difference > 0 ? '+' : ''}
                            {record.difference.toFixed(0)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">暂无预算数据</div>
        )}
      </Modal>

      {/* 调整预算弹窗 */}
      <Modal
        title="调整总预算"
        open={showAdjustModal}
        onCancel={() => {
          setShowAdjustModal(false);
          setNewBudget('');
          setAdjustReason('');
        }}
        onOk={handleAdjustBudget}
        okText="确认调整"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">新预算金额</label>
            <Input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="请输入新的预算金额"
              prefix="¥"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">调整原因（可选）</label>
            <Input.TextArea
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="请输入调整原因"
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
