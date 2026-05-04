// 打包清单抽屉组件
import { useState, useEffect } from 'react';
import {
  Drawer,
  Checkbox,
  Button,
  Input,
  Select,
  Empty,
  message,
  Spin,
  Progress,
  Space,
  Popconfirm,
} from 'antd';
import { Plus, Trash2, CheckCircle, Circle, Briefcase, RefreshCw } from 'lucide-react';
import {
  getPackingList,
  initializePackingList,
  addPackingItem,
  updatePackingItem,
  deletePackingItem,
  getPackingCategories,
  getPackingProgress,
  type PackingItem,
  type PackingProgress,
} from '../../api/client';

interface PackingListDrawerProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

// 分类名称映射
const CATEGORY_NAMES: Record<string, string> = {
  clothing: '衣物',
  electronics: '电子产品',
  documents: '证件文件',
  toiletries: '洗漱用品',
  medicine: '药品',
  other: '其他',
};

// 分类图标
const CATEGORY_ICONS: Record<string, JSX.Element> = {
  clothing: <Briefcase className="w-4 h-4" />,
  electronics: <Briefcase className="w-4 h-4" />,
  documents: <Briefcase className="w-4 h-4" />,
  toiletries: <Briefcase className="w-4 h-4" />,
  medicine: <Briefcase className="w-4 h-4" />,
  other: <Briefcase className="w-4 h-4" />,
};

export default function PackingListDrawer({ visible, onClose, tripId }: PackingListDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [categories, setCategories] = useState<Array<{ key: string; name: string }>>([]);
  const [progress, setProgress] = useState<PackingProgress>({ total: 0, packed: 0, percentage: 0 });
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('other');
  const [isAdding, setIsAdding] = useState(false);

  // 加载打包清单
  const loadPackingList = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const result = await getPackingList(tripId);

      if (result.success && result.data) {
        // 如果清单为空，自动初始化
        if (result.data.length === 0) {
          await initializePackingList(tripId);
          const initializedResult = await getPackingList(tripId);
          if (initializedResult.success && initializedResult.data) {
            setItems(initializedResult.data);
          }
        } else {
          setItems(result.data);
        }
      }
    } catch (error: any) {
      console.error('加载打包清单失败:', error);
      message.error('加载打包清单失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载分类
  const loadCategories = async () => {
    try {
      const result = await getPackingCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error: any) {
      console.error('加载分类失败:', error);
    }
  };

  // 加载进度
  const loadProgress = async () => {
    if (!tripId) return;

    try {
      const result = await getPackingProgress(tripId);
      if (result.success && result.data) {
        setProgress(result.data);
      }
    } catch (error: any) {
      console.error('加载进度失败:', error);
    }
  };

  // 切换物品打包状态
  const handleTogglePacked = async (itemId: string, currentStatus: boolean) => {
    try {
      await updatePackingItem(itemId, { isPacked: !currentStatus });
      setItems(
        items.map((item) => (item.id === itemId ? { ...item, isPacked: !currentStatus } : item))
      );
      await loadProgress();
    } catch (error: any) {
      console.error('更新物品状态失败:', error);
      message.error('更新物品状态失败');
    }
  };

  // 添加物品
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      message.warning('请输入物品名称');
      return;
    }

    try {
      await addPackingItem(tripId, newItemName.trim(), newItemCategory);
      message.success('添加成功');
      setNewItemName('');
      setNewItemCategory('other');
      setIsAdding(false);
      await loadPackingList();
      await loadProgress();
    } catch (error: any) {
      console.error('添加物品失败:', error);
      message.error('添加物品失败');
    }
  };

  // 删除物品
  const handleDeleteItem = async (itemId: string) => {
    try {
      await deletePackingItem(itemId);
      message.success('删除成功');
      await loadPackingList();
      await loadProgress();
    } catch (error: any) {
      console.error('删除物品失败:', error);
      message.error('删除物品失败');
    }
  };

  // 按分类分组物品
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PackingItem[]>
  );

  // 初始化时加载数据
  useEffect(() => {
    if (visible && tripId) {
      loadPackingList();
      loadCategories();
      loadProgress();
    }
  }, [visible, tripId]);

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          <span>打包清单</span>
        </div>
      }
      onClose={onClose}
      open={visible}
      width={480}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">打包进度:</span>
            <Progress
              percent={progress.percentage}
              size="small"
              format={(percent) => `${percent}% (${progress.packed}/${progress.total})`}
              style={{ width: 200 }}
            />
          </div>
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      <Spin spinning={loading}>
        <div className="space-y-6">
          {/* 添加物品区域 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            {isAdding ? (
              <Space direction="vertical" className="w-full">
                <Input
                  placeholder="输入物品名称"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onPressEnter={handleAddItem}
                />
                <div className="flex gap-2">
                  <Select
                    className="flex-1"
                    placeholder="选择分类"
                    value={newItemCategory}
                    onChange={setNewItemCategory}
                    options={categories.map((cat) => ({
                      label: cat.name,
                      value: cat.key,
                    }))}
                  />
                  <Button type="primary" onClick={handleAddItem}>
                    添加
                  </Button>
                  <Button onClick={() => setIsAdding(false)}>取消</Button>
                </div>
              </Space>
            ) : (
              <Button
                type="dashed"
                block
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAdding(true)}
              >
                添加物品
              </Button>
            )}
          </div>

          {/* 物品列表 */}
          {Object.keys(groupedItems).length === 0 ? (
            <Empty description="暂无物品" />
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  {/* 分类标题 */}
                  <div className="bg-gray-50 px-4 py-2 flex items-center gap-2">
                    {CATEGORY_ICONS[category]}
                    <span className="font-medium">{CATEGORY_NAMES[category] || category}</span>
                    <span className="text-sm text-gray-500">
                      ({categoryItems.filter((item) => item.isPacked).length}/{categoryItems.length}
                      )
                    </span>
                  </div>

                  {/* 物品列表 */}
                  <div className="p-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded group"
                      >
                        <Checkbox
                          checked={item.isPacked}
                          onChange={() => handleTogglePacked(item.id, item.isPacked)}
                        >
                          <span className={item.isPacked ? 'line-through text-gray-400' : ''}>
                            {item.itemName}
                          </span>
                        </Checkbox>

                        <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popconfirm
                            title="确定删除这个物品吗？"
                            onConfirm={() => handleDeleteItem(item.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<Trash2 className="w-4 h-4" />}
                            />
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Spin>
    </Drawer>
  );
}
