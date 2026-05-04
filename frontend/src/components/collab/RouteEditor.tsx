/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 路线编辑器组件 - 可拖拽排序的路线点列表
import { GripVertical, MapPin, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface RouteSpot {
  id: string;
  name: string;
  location: string;
  order: number;
}

interface SortableSpotProps {
  spot: RouteSpot;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function SortableSpot({
  spot,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SortableSpotProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: spot.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white border border-border rounded-lg hover:shadow-sm transition-shadow"
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* 序号 */}
      <div className="w-6 h-6 rounded-full bg-livetrip-primary text-white flex items-center justify-center text-xs font-bold">
        {spot.order}
      </div>

      {/* 景点信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-livetrip-primary flex-shrink-0" />
          <p className="text-sm font-medium truncate">{spot.name}</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        {!isFirst && (
          <button
            onClick={() => onMoveUp(spot.id)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="上移"
          >
            <ChevronUp className="h-4 w-4 text-gray-500" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => onMoveDown(spot.id)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="下移"
          >
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        )}
        <button
          onClick={() => onRemove(spot.id)}
          className="p-1 hover:bg-red-50 rounded transition-colors"
          title="移除"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}

interface RouteEditorProps {
  spots: RouteSpot[];
  onSpotsChange: (spots: RouteSpot[]) => void;
  onSubmit?: () => void;
  isLocked?: boolean;
}

export default function RouteEditor({
  spots,
  onSpotsChange,
  onSubmit,
  isLocked = false,
}: RouteEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = spots.findIndex((s) => s.id === active.id);
      const newIndex = spots.findIndex((s) => s.id === over.id);

      const newSpots = arrayMove(spots, oldIndex, newIndex).map((spot, index) => ({
        ...spot,
        order: index + 1,
      }));

      onSpotsChange(newSpots);
    }
  };

  const handleRemove = (id: string) => {
    const newSpots = spots
      .filter((s) => s.id !== id)
      .map((spot, index) => ({
        ...spot,
        order: index + 1,
      }));
    onSpotsChange(newSpots);
  };

  const handleMoveUp = (id: string) => {
    const index = spots.findIndex((s) => s.id === id);
    if (index > 0) {
      const newSpots = [...spots];
      [newSpots[index - 1], newSpots[index]] = [newSpots[index], newSpots[index - 1]];
      newSpots.forEach((spot, i) => {
        spot.order = i + 1;
      });
      onSpotsChange(newSpots);
    }
  };

  const handleMoveDown = (id: string) => {
    const index = spots.findIndex((s) => s.id === id);
    if (index < spots.length - 1) {
      const newSpots = [...spots];
      [newSpots[index], newSpots[index + 1]] = [newSpots[index + 1], newSpots[index]];
      newSpots.forEach((spot, i) => {
        spot.order = i + 1;
      });
      onSpotsChange(newSpots);
    }
  };

  if (spots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">点击地图上的景点添加到路线</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={spots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {spots.map((spot, index) => (
            <SortableSpot
              key={spot.id}
              spot={spot}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === spots.length - 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* 提交按钮 */}
      {onSubmit && !isLocked && (
        <button
          onClick={onSubmit}
          className="w-full py-2.5 bg-livetrip-primary text-white rounded-lg font-medium hover:bg-livetrip-primary/90 transition-colors"
        >
          提交今日路线
        </button>
      )}
    </div>
  );
}
