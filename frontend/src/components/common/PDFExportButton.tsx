/**
 * PDF导出按钮组件
 * 用于将行程导出为PDF文件
 */

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import { generateTripPDF } from '../../utils/pdfGenerator';

interface PDFExportButtonProps {
  tripData: any;
  style?: React.CSSProperties;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({ tripData, style }) => {
  const [loading, setLoading] = useState(false);

  // 导出PDF
  const handleExport = async () => {
    if (!tripData) {
      message.error('行程数据不存在');
      return;
    }

    setLoading(true);
    try {
      // 数据结构转换: 兼容两种数据格式
      // 格式1: { days: [{ dayNumber, itineraryItems }] } - 来自数据库
      // 格式2: { itinerary: [{ day, attractions }] } - 来自行程规划页面
      let normalizedData = tripData;

      // 如果是 itinerary.itinerary 格式,转换为 days 格式
      if (tripData.itinerary && Array.isArray(tripData.itinerary) && !tripData.days) {
        console.log('🔄 检测到 itinerary 格式数据,进行转换...');
        normalizedData = {
          ...tripData,
          days: tripData.itinerary.map((day: any) => ({
            dayNumber: day.day,
            date: day.date,
            itineraryItems: day.attractions?.map((item: any) => ({
              name: item.name,
              type: item.type,
              category: item.description,
              description: item.description,
              startTime: item.startTime,
              endTime: item.endTime,
              address: item.address,
              cost: item.estimated_cost,
              longitude: item.longitude,
              latitude: item.latitude,
            })) || [],
          })),
        };
        console.log('✅ 数据转换完成:', normalizedData);
      }

      // 转换数据格式以适配PDF生成器
      // 包含完整的坐标信息,以便生成地图截图
      const pdfData = {
        id: normalizedData.id,
        title: normalizedData.title,
        destination: normalizedData.destination,
        startDate: normalizedData.startDate,
        endDate: normalizedData.endDate,
        totalBudget: normalizedData.totalBudget,
        days: normalizedData.days?.map((day: any) => ({
          dayNumber: day.dayNumber,
          date: day.date,
          notes: day.notes,
          restaurantName: day.restaurantName,
          restaurantAddress: day.restaurantAddress,
          restaurantLocation: day.restaurantLocation, // 餐厅位置坐标(用于地图显示)
          restaurantType: day.restaurantType,
          restaurantRating: day.restaurantRating,
          itineraryItems: day.itineraryItems?.map((item: any) => ({
            name: item.name,
            type: item.type,
            category: item.category,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            address: item.address,
            cost: item.cost,
            longitude: item.longitude, // 景点经度(用于地图显示)
            latitude: item.latitude,   // 景点纬度(用于地图显示)
          })) || [],
        })) || [],
        budget: normalizedData.budget,
        // 酒店信息(用于地图显示) - 支持两种格式
        hotelName: normalizedData.hotel?.name || normalizedData.hotelName,
        hotelAddress: normalizedData.hotel?.address || normalizedData.hotelAddress,
        hotelLocation: normalizedData.hotel?.location || normalizedData.hotelLocation, // 酒店位置坐标
        hotelType: normalizedData.hotel?.type || normalizedData.hotelType,
        hotelRating: normalizedData.hotel?.rating || normalizedData.hotelRating,
        hotelTel: normalizedData.hotel?.tel || normalizedData.hotelTel,
      };

      await generateTripPDF(pdfData);
      message.success('PDF导出成功');
    } catch (error: any) {
      console.error('PDF导出失败:', error);
      message.error(error.message || 'PDF导出失败,请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="default"
      icon={<FilePdfOutlined />}
      onClick={handleExport}
      loading={loading}
      style={style}
    >
      导出PDF
    </Button>
  );
};

export default PDFExportButton;

