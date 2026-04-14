"use client";

import { useState, useEffect } from "react";
import { Package, Check, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getPackingList, savePackingList } from "@/api/client";
import { PRESET_CATEGORIES } from "@/config/presetItems";

interface PackingItem {
  id: string;
  itemName: string;
  category: string;
  isPacked: boolean;
  isCustom: boolean;
}

interface PackingListWidgetProps {
  itineraryId: string;
  editable?: boolean;
  compact?: boolean;
  title?: string;
}

export function PackingListWidget({ 
  itineraryId, 
  editable = false, 
  compact = false,
  title = "行李清单"
}: PackingListWidgetProps) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("其他");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showPresetItems, setShowPresetItems] = useState(false);

  useEffect(() => {
    loadPackingItems();
  }, [itineraryId]);

  const loadPackingItems = async () => {
    console.log('🔄 PackingListWidget 加载数据:', { itineraryId, editable, compact, title });
    setLoading(true);
    try {
      // 获取现有清单
      const response = await getPackingList(itineraryId);
      console.log('📦 getPackingList 响应:', response);

      if (response.success && response.data) {
        setItems(response.data);
        console.log(`✅ 加载了 ${response.data.length} 个打包物品`);
      } else {
        // 如果获取失败，设置为空数组
        setItems([]);
        console.log('📦 打包清单为空');
      }
    } catch (error) {
      console.error('❌ 加载行李清单失败:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePacked = async (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    setItems(updatedItems);
    
    if (editable) {
      await savePackingList(itineraryId, updatedItems);
    }
  };

  const addPresetItem = async (itemName: string, category: string) => {
    // 检查是否已存在
    if (items.some(item => item.itemName === itemName)) {
      return;
    }

    const newPackingItem: PackingItem = {
      id: `preset_${Date.now()}_${Math.random()}`,
      itemName,
      category,
      isPacked: false,
      isCustom: false
    };

    const updatedItems = [...items, newPackingItem];
    setItems(updatedItems);

    if (editable && itineraryId) {
      try {
        console.log('💾 保存打包清单:', { itineraryId, itemCount: updatedItems.length });
        const result = await savePackingList(itineraryId, updatedItems);
        console.log('✅ 保存结果:', result);
      } catch (error) {
        console.error('❌ 保存失败:', error);
      }
    } else {
      console.warn('⚠️ 无法保存: editable=', editable, 'itineraryId=', itineraryId);
    }
  };

  const addCustomItem = async () => {
    if (!newItem.trim()) return;

    const newPackingItem: PackingItem = {
      id: `custom_${Date.now()}`,
      itemName: newItem.trim(),
      category: selectedCategory,
      isPacked: false,
      isCustom: true
    };

    const updatedItems = [...items, newPackingItem];
    setItems(updatedItems);
    setNewItem("");
    setShowAddForm(false);

    if (editable) {
      await savePackingList(itineraryId, updatedItems);
    }
  };

  const removeItem = async (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);

    if (editable) {
      await savePackingList(itineraryId, updatedItems);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  const packedCount = items.filter(item => item.isPacked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="text-gray-500 text-sm">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-livetrip-primary" />
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </div>
            <div className="text-sm text-gray-500">
              {packedCount}/{totalCount}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-livetrip-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {totalCount === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              暂无打包物品
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(groupedItems).slice(0, 2).map(([category, categoryItems]) => (
                <div key={category}>
                  <div className="text-xs text-gray-500 mb-1">{category}</div>
                  <div className="flex flex-wrap gap-2">
                    {categoryItems.slice(0, 4).map(item => (
                      <div 
                        key={item.id}
                        className={`text-xs px-2 py-1 rounded ${
                          item.isPacked 
                            ? 'bg-livetrip-primary-light text-livetrip-primary-dark line-through' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.itemName}
                      </div>
                    ))}
                    {categoryItems.length > 4 && (
                      <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                        +{categoryItems.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-livetrip-primary" />
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </div>
          <div className="text-sm text-gray-500">
            {packedCount}/{totalCount} 已打包
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-livetrip-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* 已添加的物品 */}
        <div className="space-y-4 mb-4">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category}>
              <div className="text-sm font-medium text-gray-700 mb-2">{category}</div>
              <div className="space-y-2">
                {categoryItems.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {editable ? (
                      <Checkbox
                        checked={item.isPacked}
                        onCheckedChange={() => togglePacked(item.id)}
                        className="data-[state=checked]:bg-livetrip-primary data-[state=checked]:border-livetrip-primary"
                      />
                    ) : (
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        item.isPacked 
                          ? 'bg-livetrip-primary border-livetrip-primary' 
                          : 'border-gray-300'
                      }`}>
                        {item.isPacked && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}
                    <span className={`flex-1 text-sm ${
                      item.isPacked ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}>
                      {item.itemName}
                    </span>
                    {editable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {editable && (
          <div className="space-y-3 pt-4 border-t">
            {/* 预设物品选择 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setShowPresetItems(!showPresetItems)}
            >
              {showPresetItems ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              {showPresetItems ? '收起预设物品' : '选择预设物品'}
            </Button>

            {showPresetItems && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                {PRESET_CATEGORIES.map(category => {
                  const isExpanded = expandedCategories.has(category.name);
                  const categoryItems = items.filter(item => item.category === category.name);
                  
                  return (
                    <div key={category.name}>
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                      >
                        <span>{category.name} ({categoryItems.length})</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="flex flex-wrap gap-2">
                          {category.items.map(itemName => {
                            const isAdded = items.some(item => item.itemName === itemName);
                            return (
                              <button
                                key={itemName}
                                onClick={() => {
                                  if (!isAdded) {
                                    addPresetItem(itemName, category.name);
                                  }
                                }}
                                disabled={isAdded}
                                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                                  isAdded
                                    ? 'bg-livetrip-primary text-white cursor-not-allowed'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:border-livetrip-primary hover:text-livetrip-primary'
                                }`}
                              >
                                {isAdded && <Check className="h-3 w-3 inline mr-1" />}
                                {itemName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 添加自定义物品 */}
            {!showAddForm ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加自定义物品
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="输入物品名称"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 text-sm border rounded px-3 py-2"
                  >
                    {PRESET_CATEGORIES.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="其他">其他</option>
                  </select>
                  <Button
                    size="sm"
                    className="bg-livetrip-primary hover:bg-livetrip-primary-dark text-white"
                    onClick={addCustomItem}
                  >
                    添加
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
