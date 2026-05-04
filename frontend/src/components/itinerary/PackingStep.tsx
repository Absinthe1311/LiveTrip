// 行李打包步骤组件
import React, { useState, useEffect } from 'react';
import { message, Modal, Input, Select } from 'antd';
import {
  Package,
  Check,
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Briefcase,
  CreditCard,
  Smartphone,
  Shirt,
  Droplets,
  Pill,
  MoreHorizontal,
} from 'lucide-react';
import { PRESET_CATEGORIES, getAllPresetItems, PresetItem } from '../../config/presetItems';

export interface PackingItemData {
  id?: string;
  itemName: string;
  category: string;
  isPacked: boolean;
  isSuggested?: boolean;
  isDefault?: boolean;
}

interface PackingStepProps {
  tripId?: string;
  initialItems?: PackingItemData[];
  onSave: (items: PackingItemData[]) => Promise<void>;
}

export default function PackingStep({ tripId, initialItems = [], onSave }: PackingStepProps) {
  const [packingItems, setPackingItems] = useState<PackingItemData[]>(initialItems);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItemData | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('其他');

  // 初始化：展开所有分类
  useEffect(() => {
    const allCategories = new Set(PRESET_CATEGORIES.map((c) => c.name));
    setExpandedCategories(allCategories);
  }, []);

  // 切换分类展开状态
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // 添加预设物品
  const addPresetItem = async (itemName: string, category: string) => {
    // 检查是否已存在
    if (packingItems.some((item) => item.itemName === itemName)) {
      message.warning('该物品已在清单中');
      return;
    }

    const newItem: PackingItemData = {
      itemName,
      category,
      isPacked: false,
      isDefault: true,
    };

    const newItems = [...packingItems, newItem];
    setPackingItems(newItems);
    message.success(`已添加 ${itemName}`);

    // 自动保存
    await onSave(newItems);
  };

  // 移除物品
  const removeItem = async (item: PackingItemData) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要从清单中移除 "${item.itemName}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const newItems = packingItems.filter((i) => i.itemName !== item.itemName);
        setPackingItems(newItems);
        message.success('已移除');

        // 自动保存
        await onSave(newItems);
      },
    });
  };

  // 切换打包状态
  const togglePacked = async (itemName: string) => {
    const newItems = packingItems.map((item) =>
      item.itemName === itemName ? { ...item, isPacked: !item.isPacked } : item
    );
    setPackingItems(newItems);

    // 自动保存
    await onSave(newItems);
  };

  // 打开添加自定义物品模态框
  const openAddModal = () => {
    setNewItemName('');
    setNewItemCategory('其他');
    setAddModalVisible(true);
  };

  // 添加自定义物品
  const handleAddCustomItem = () => {
    if (!newItemName.trim()) {
      message.error('请输入物品名称');
      return;
    }

    if (newItemName.length > 50) {
      message.error('物品名称不能超过50个字符');
      return;
    }

    if (packingItems.some((item) => item.itemName === newItemName.trim())) {
      message.error('该物品已在清单中');
      return;
    }

    const newItem: PackingItemData = {
      itemName: newItemName.trim(),
      category: newItemCategory,
      isPacked: false,
      isDefault: false,
    };

    setPackingItems((prev) => [...prev, newItem]);
    setAddModalVisible(false);
    message.success(`已添加 ${newItemName.trim()}`);
  };

  // 打开编辑模态框
  const openEditModal = (item: PackingItemData) => {
    if (item.isDefault) {
      message.warning('预设物品不可编辑');
      return;
    }
    setEditingItem(item);
    setNewItemName(item.itemName);
    setNewItemCategory(item.category);
    setEditModalVisible(true);
  };

  // 编辑物品
  const handleEditItem = () => {
    if (!newItemName.trim()) {
      message.error('请输入物品名称');
      return;
    }

    if (newItemName.length > 50) {
      message.error('物品名称不能超过50个字符');
      return;
    }

    if (!editingItem) return;

    setPackingItems((prev) =>
      prev.map((item) =>
        item.itemName === editingItem.itemName
          ? { ...item, itemName: newItemName.trim(), category: newItemCategory }
          : item
      )
    );
    setEditModalVisible(false);
    message.success('已更新');
  };

  // 保存并继续
  const handleSaveAndContinue = async () => {
    setLoading(true);
    try {
      await onSave(packingItems);
      message.success('打包清单已保存');
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算打包进度
  const packedCount = packingItems.filter((item) => item.isPacked).length;
  const totalCount = packingItems.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  // 按分类分组物品
  const itemsByCategory = packingItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PackingItemData[]>
  );

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 border border-white/30 shadow-lg">
      {/* 标题和进度 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Package className="w-8 h-8 text-[#145F39]" />
          <h2 className="text-3xl font-bold text-white">行李打包清单</h2>
        </div>
        <p className="text-white/60 mb-4">准备您的行李，确保旅途无忧</p>

        {/* 进度条 */}
        {totalCount > 0 && (
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span>打包进度</span>
              <span>
                {packedCount} / {totalCount} 已打包
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#145F39] to-[#005746] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 添加自定义物品按钮 */}
      <div className="mb-6">
        <button
          onClick={openAddModal}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#CDEDDE]/30 to-[#CDEDDE]/20 hover:from-[#CDEDDE]/40 hover:to-[#CDEDDE]/30 text-[#005746] font-medium transition-all duration-300 border border-[#CDEDDE]/50"
        >
          <Plus className="w-5 h-5" />
          <span>添加自定义物品</span>
        </button>
      </div>

      {/* 预设物品分类 */}
      <div className="space-y-4 mb-6">
        {PRESET_CATEGORIES.map((category) => {
          const categoryItems = itemsByCategory[category.name] || [];
          const isExpanded = expandedCategories.has(category.name);

          // 获取图标组件
          const getIconComponent = (iconName: string) => {
            switch (iconName) {
              case 'CreditCard':
                return CreditCard;
              case 'Smartphone':
                return Smartphone;
              case 'Shirt':
                return Shirt;
              case 'Droplets':
                return Droplets;
              case 'Pill':
                return Pill;
              case 'Briefcase':
                return Briefcase;
              default:
                return Package;
            }
          };
          const IconComponent = getIconComponent(category.icon);

          return (
            <div
              key={category.name}
              className="bg-white/10 rounded-xl border border-white/20 overflow-hidden"
            >
              {/* 分类标题 */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-6 h-6 text-[#CDEDDE]" />
                  <span className="text-lg font-semibold text-white">{category.name}</span>
                  {categoryItems.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#145F39]/20 text-[#CDEDDE] text-sm">
                      {categoryItems.length}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/60" />
                )}
              </button>

              {/* 分类内容 */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {/* 已添加的物品 */}
                  {categoryItems.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {categoryItems.map((item) => (
                        <div
                          key={item.itemName}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/10 border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => togglePacked(item.itemName)}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                item.isPacked
                                  ? 'bg-[#145F39] border-[#145F39]'
                                  : 'border-white/30 hover:border-[#145F39]'
                              }`}
                            >
                              {item.isPacked && <Check className="w-4 h-4 text-white" />}
                            </button>
                            <span
                              className={`text-white ${item.isPacked ? 'line-through opacity-50' : ''}`}
                            >
                              {item.itemName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!item.isDefault && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-white/60" />
                              </button>
                            )}
                            <button
                              onClick={() => removeItem(item)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-white/60" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 预设物品网格 */}
                  <div className="grid grid-cols-3 gap-2">
                    {category.items.map((itemName) => {
                      const isAdded = packingItems.some((item) => item.itemName === itemName);
                      return (
                        <button
                          key={itemName}
                          onClick={() => addPresetItem(itemName, category.name)}
                          disabled={isAdded}
                          className={`p-2 rounded-lg text-sm text-left transition-all ${
                            isAdded
                              ? 'bg-[#145F39]/20 text-[#CDEDDE] border border-[#145F39]/30'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {itemName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 添加自定义物品模态框 */}
      <Modal
        title="添加自定义物品"
        open={addModalVisible}
        onOk={handleAddCustomItem}
        onCancel={() => setAddModalVisible(false)}
        okText="添加"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物品名称</label>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="请输入物品名称"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <Select
              value={newItemCategory}
              onChange={setNewItemCategory}
              className="w-full"
              options={PRESET_CATEGORIES.map((c) => ({ label: c.name, value: c.name }))}
            />
          </div>
        </div>
      </Modal>

      {/* 编辑物品模态框 */}
      <Modal
        title="编辑物品"
        open={editModalVisible}
        onOk={handleEditItem}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物品名称</label>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="请输入物品名称"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <Select
              value={newItemCategory}
              onChange={setNewItemCategory}
              className="w-full"
              options={PRESET_CATEGORIES.map((c) => ({ label: c.name, value: c.name }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
