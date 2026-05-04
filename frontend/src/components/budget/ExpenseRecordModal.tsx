// AI辅助生成：GLM-5, 2026-04-24 21:31
// 描述：开支记录弹窗组件，实现记账本式的开支记录功能，支持添加每日开支、查看开支历史

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, message } from 'antd';
import {
  Plus,
  Calendar,
  DollarSign,
  Trash2,
  Edit2,
  Car,
  Building2,
  Utensils,
  Ticket,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { budgetStats, updPrice, budgetLog } from '../../api/client';

interface ExpenseRecordModalProps {
  visible: boolean;
  tripId: string;
  onClose: () => void;
  onUpdate?: () => void;
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

const categoryOptions = [
  { value: 'transportation', label: '交通' },
  { value: 'accommodation', label: '住宿' },
  { value: 'dining', label: '餐饮' },
  { value: 'tickets', label: '门票' },
  { value: 'shopping', label: '购物' },
  { value: 'other', label: '其他' },
];

export default function ExpenseRecordModal({
  visible,
  tripId,
  onClose,
  onUpdate,
}: ExpenseRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BudgetRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // 添加开支表单
  const [expenseCategory, setExpenseCategory] = useState('dining');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');

  useEffect(() => {
    if (visible && tripId) {
      loadHistory();
    }
  }, [visible, tripId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await budgetLog(tripId, 50);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('加载开支历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      message.error('请输入有效的金额');
      return;
    }
    if (!expenseName.trim()) {
      message.error('请输入开支名称');
      return;
    }

    try {
      // 添加开支记录（previousAmount为0，newAmount为实际金额）
      const response = await updPrice(tripId, expenseCategory, expenseName, 0, amount);

      if (response.success) {
        message.success('开支记录已添加');
        // 重置表单
        setExpenseName('');
        setExpenseAmount('');
        setExpenseNote('');
        setShowAddForm(false);
        // 重新加载历史
        loadHistory();
        onUpdate?.();
      } else {
        message.error(response.message || '添加失败');
      }
    } catch (error) {
      console.error('添加开支失败:', error);
      message.error('添加开支失败');
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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      transportation: <Car className="h-4 w-4" />,
      accommodation: <Building2 className="h-4 w-4" />,
      dining: <Utensils className="h-4 w-4" />,
      tickets: <Ticket className="h-4 w-4" />,
      shopping: <ShoppingBag className="h-4 w-4" />,
      other: <Wallet className="h-4 w-4" />,
    };
    return icons[category] || <Wallet className="h-4 w-4" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          <span>开支记录</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div className="space-y-4">
        {/* 添加开支按钮 */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? '取消添加' : '添加新开支'}
        </button>

        {/* 添加开支表单 */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">分类</label>
                <Select
                  value={expenseCategory}
                  onChange={setExpenseCategory}
                  options={categoryOptions}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">金额</label>
                <Input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="请输入金额"
                  prefix="¥"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">开支名称</label>
              <Input
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="如：午餐、打车、门票等"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">备注（可选）</label>
              <Input.TextArea
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                placeholder="添加备注信息"
                rows={2}
              />
            </div>
            <button
              onClick={handleAddExpense}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              确认添加
            </button>
          </div>
        )}

        {/* 开支历史记录 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            开支历史
          </h4>
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📝</div>
              <p>暂无开支记录</p>
              <p className="text-sm">点击上方按钮添加第一笔开支</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-400">
                          {record.category ? (
                            getCategoryIcon(record.category)
                          ) : (
                            <Wallet className="h-4 w-4" />
                          )}
                        </span>
                        <span className="font-medium text-gray-800">
                          {record.relatedItemName || record.description}
                        </span>
                        {record.category && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                            {getCategoryName(record.category)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(record.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${record.difference > 0 ? 'text-red-500' : 'text-green-500'}`}
                      >
                        {record.difference > 0 ? '-' : '+'}¥{Math.abs(record.difference).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-400">
                        剩余 ¥{record.remainingBudget.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
