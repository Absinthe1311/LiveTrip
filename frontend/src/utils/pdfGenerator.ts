/**
 * PDF生成工具 - 优化版
 * 使用html2canvas将DOM元素转换为PDF文档
 * 参考小红书风格,优化排版和视觉效果
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import { generateDayMapScreenshot } from './mapScreenshot';

/**
 * 行程数据接口
 */
interface TripData {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  days: DayData[];
  budget?: BudgetData;
  hotelName?: string;
  hotelAddress?: string;
  hotelLocation?: string;
  hotelType?: string;
  hotelRating?: number;
  hotelTel?: string;
}

interface DayData {
  dayNumber: number;
  date: string;
  notes?: string;
  itineraryItems: ItineraryItemData[];
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLocation?: string;
  restaurantType?: string;
  restaurantRating?: number;
  restaurantTel?: string;
}

interface ItineraryItemData {
  name: string;
  type: string;
  category?: string;
  description?: string;
  startTime: string;
  endTime: string;
  address?: string;
  cost: number;
  longitude?: number;
  latitude?: number;
}

interface BudgetData {
  transportation: number;
  accommodation: number;
  food: number;
  tickets: number;
  shopping: number;
  other: number;
}

/**
 * 生成行程PDF
 * @param trip 行程数据
 * @returns Promise<void>
 */
export async function generateTripPDF(trip: TripData): Promise<void> {
  console.log('📄 开始生成PDF...');

  // 创建临时容器
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4宽度
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    // 创建PDF文档 (A4尺寸)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // ========== 第1页: 封面 ==========
    const coverElement = createCoverElement(trip);
    container.appendChild(coverElement);

    await new Promise(resolve => setTimeout(resolve, 100));

    const coverCanvas = await html2canvas(coverElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const coverImgData = coverCanvas.toDataURL('image/jpeg', 0.95);
    const coverImgWidth = pageWidth;
    const coverImgHeight = (coverCanvas.height * pageWidth) / coverCanvas.width;

    pdf.addImage(coverImgData, 'JPEG', 0, 0, coverImgWidth, coverImgHeight);
    console.log('✅ 封面页生成完成');

    container.removeChild(coverElement);

    // ========== 第2页: 行程概览 ==========
    pdf.addPage();
    const overviewElement = createOverviewElement(trip);
    container.appendChild(overviewElement);

    await new Promise(resolve => setTimeout(resolve, 100));

    const overviewCanvas = await html2canvas(overviewElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const overviewImgData = overviewCanvas.toDataURL('image/jpeg', 0.95);
    const overviewImgWidth = pageWidth;
    const overviewImgHeight = (overviewCanvas.height * pageWidth) / overviewCanvas.width;

    pdf.addImage(overviewImgData, 'JPEG', 0, 0, overviewImgWidth, overviewImgHeight);
    console.log('✅ 行程概览页生成完成');

    container.removeChild(overviewElement);

    // ========== 第3页: 酒店和餐厅信息 ==========
    if (trip.hotelName || trip.days.some(d => d.restaurantName)) {
      pdf.addPage();
      const accommodationElement = createAccommodationElement(trip);
      container.appendChild(accommodationElement);

      await new Promise(resolve => setTimeout(resolve, 100));

      const accommodationCanvas = await html2canvas(accommodationElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const accommodationImgData = accommodationCanvas.toDataURL('image/jpeg', 0.95);
      const accommodationImgWidth = pageWidth;
      const accommodationImgHeight = (accommodationCanvas.height * pageWidth) / accommodationCanvas.width;

      pdf.addImage(accommodationImgData, 'JPEG', 0, 0, accommodationImgWidth, accommodationImgHeight);
      console.log('✅ 住宿餐饮页生成完成');

      container.removeChild(accommodationElement);
    }

    // ========== 第4-N页: 每日行程 ==========
    for (let i = 0; i < trip.days.length; i++) {
      const day = trip.days[i];

      // 添加每日地图页面
      const hasCoordinates = day.itineraryItems.some(item => item.longitude && item.latitude);

      if (hasCoordinates) {
        try {
          console.log(`🗺️ 开始生成第${day.dayNumber}天地图截图...`);

          // 准备单日行程数据
          const dayData = {
            dayNumber: day.dayNumber,
            itineraryItems: day.itineraryItems.map(item => ({
              name: item.name,
              longitude: item.longitude,
              latitude: item.latitude,
            })),
            restaurantName: day.restaurantName,
            restaurantLocation: day.restaurantLocation,
          };

          // 准备酒店信息
          const hotelInfo = trip.hotelLocation ? {
            name: trip.hotelName,
            location: trip.hotelLocation,
          } : undefined;

          console.log('准备地图数据:', {
            dayNumber: day.dayNumber,
            itemsCount: dayData.itineraryItems.length,
            hasHotel: !!hotelInfo,
            hotelInfo
          });

          // 先生成地图,成功后再添加页面
          const mapImageUrl = await generateDayMapScreenshot(dayData, hotelInfo, 800, 600);

          console.log(`📸 第${day.dayNumber}天地图截图生成完成,URL长度: ${mapImageUrl.length}`);

          // 验证图片URL
          if (!mapImageUrl || mapImageUrl.length < 100) {
            throw new Error('地图图片URL无效');
          }

          const img = new Image();
          img.src = mapImageUrl;

          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              console.log(`✅ 地图图片加载成功,尺寸: ${img.width}x${img.height}`);
              resolve();
            };
            img.onerror = (e) => {
              console.error('地图图片加载失败:', e);
              reject(new Error('地图图片加载失败'));
            };
            // 添加超时处理
            setTimeout(() => reject(new Error('地图图片加载超时')), 5000);
          });

          // 图片加载成功,添加新页面
          pdf.addPage();

          const mapImgWidth = pageWidth;
          const mapImgHeight = (img.height * pageWidth) / img.width;

          pdf.addImage(mapImageUrl, 'JPEG', 0, 0, mapImgWidth, mapImgHeight);
          console.log(`✅ 第${day.dayNumber}天地图页生成完成`);

        } catch (error) {
          console.error(`❌ 第${day.dayNumber}天地图生成失败:`, error);
          // 地图生成失败,不添加空白页,继续生成其他内容
        }
      } else {
        console.log(`⚠️ 第${day.dayNumber}天没有坐标数据,跳过地图生成`);
      }

      // 添加每日行程详情页面
      pdf.addPage();

      const dayElement = createDayElement(day, trip);
      container.appendChild(dayElement);

      await new Promise(resolve => setTimeout(resolve, 100));

      const dayCanvas = await html2canvas(dayElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const dayImgData = dayCanvas.toDataURL('image/jpeg', 0.95);
      const dayImgWidth = pageWidth;
      const dayImgHeight = (dayCanvas.height * pageWidth) / dayCanvas.width;

      // 分页处理
      if (dayImgHeight > pageHeight) {
        let remainingHeight = dayImgHeight;
        let currentPosition = 0;

        while (remainingHeight > 0) {
          if (currentPosition > 0) {
            pdf.addPage();
          }

          const heightOnPage = Math.min(remainingHeight, pageHeight);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = dayCanvas.width;
          tempCanvas.height = (heightOnPage / dayImgHeight) * dayCanvas.height;
          const ctx = tempCanvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(
              dayCanvas,
              0,
              (currentPosition / dayImgHeight) * dayCanvas.height,
              dayCanvas.width,
              tempCanvas.height,
              0,
              0,
              dayCanvas.width,
              tempCanvas.height
            );

            const tempImgData = tempCanvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(tempImgData, 'JPEG', 0, 0, dayImgWidth, heightOnPage);
          }

          remainingHeight -= pageHeight;
          currentPosition += pageHeight;
        }
      } else {
        pdf.addImage(dayImgData, 'JPEG', 0, 0, dayImgWidth, dayImgHeight);
      }

      console.log(`✅ 第${i + 1}天行程页生成完成`);
      container.removeChild(dayElement);
    }

    // ========== 最后一页: 预算汇总 ==========
    if (trip.budget) {
      pdf.addPage();

      const budgetElement = createBudgetElement(trip.budget, trip.totalBudget);
      container.appendChild(budgetElement);

      await new Promise(resolve => setTimeout(resolve, 100));

      const budgetCanvas = await html2canvas(budgetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const budgetImgData = budgetCanvas.toDataURL('image/jpeg', 0.95);
      const budgetImgWidth = pageWidth;
      const budgetImgHeight = (budgetCanvas.height * pageWidth) / budgetCanvas.width;

      pdf.addImage(budgetImgData, 'JPEG', 0, 0, budgetImgWidth, budgetImgHeight);
      console.log('✅ 预算汇总页生成完成');

      container.removeChild(budgetElement);
    }

    // ========== 保存PDF ==========
    const fileName = `LiveTrip_${trip.destination}_${dayjs(trip.startDate).format('YYYY-MM-DD')}.pdf`;
    pdf.save(fileName);

    console.log(`✅ PDF生成完成: ${fileName}`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 创建封面元素 - 小红书风格
 */
function createCoverElement(trip: TripData): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '210mm';
  div.style.height = '297mm';
  div.style.padding = '0';
  div.style.boxSizing = 'border-box';
  div.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.justifyContent = 'space-between';
  div.style.alignItems = 'center';
  div.style.color = '#ffffff';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.position = 'relative';
  div.style.overflow = 'hidden';

  const title = trip.title || `${trip.destination}之旅`;
  const startDate = dayjs(trip.startDate).format('MM月DD日');
  const endDate = dayjs(trip.endDate).format('MM月DD日');
  const days = dayjs(trip.endDate).diff(dayjs(trip.startDate), 'day') + 1;

  div.innerHTML = `
    <!-- 顶部装饰 -->
    <div style="width: 100%; height: 80px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;">
      <p style="font-size: 14px; margin: 0; letter-spacing: 2px;">✈️ LIVE TRIP · 你的旅行规划助手</p>
    </div>

    <!-- 主标题区域 -->
    <div style="text-align: center; padding: 0 40px;">
      <div style="font-size: 80px; margin-bottom: 20px;">🎒</div>
      <h1 style="font-size: 42px; margin: 0 0 30px 0; font-weight: bold; line-height: 1.3;">${title}</h1>
      <div style="width: 60px; height: 3px; background: rgba(255,255,255,0.8); margin: 0 auto 30px;"></div>
      <p style="font-size: 28px; margin: 0 0 15px 0; font-weight: 300;">📍 ${trip.destination}</p>
      <p style="font-size: 20px; margin: 0; opacity: 0.9;">${startDate} - ${endDate} · ${days}天</p>
    </div>

    <!-- 底部信息 -->
    <div style="width: 100%; background: rgba(0,0,0,0.2); padding: 30px 40px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
        <div style="text-align: center;">
          <p style="font-size: 32px; margin: 0 0 5px 0; font-weight: bold;">¥${trip.totalBudget.toLocaleString()}</p>
          <p style="font-size: 14px; margin: 0; opacity: 0.8;">总预算</p>
        </div>
        <div style="text-align: center;">
          <p style="font-size: 32px; margin: 0 0 5px 0; font-weight: bold;">${trip.days.length}</p>
          <p style="font-size: 14px; margin: 0; opacity: 0.8;">行程天数</p>
        </div>
        <div style="text-align: center;">
          <p style="font-size: 32px; margin: 0 0 5px 0; font-weight: bold;">${trip.days.reduce((sum, d) => sum + d.itineraryItems.length, 0)}</p>
          <p style="font-size: 14px; margin: 0; opacity: 0.8;">景点数量</p>
        </div>
      </div>
      <p style="font-size: 12px; margin: 0; text-align: center; opacity: 0.6;">Generated by LiveTrip · ${dayjs().format('YYYY-MM-DD HH:mm')}</p>
    </div>
  `;

  return div;
}

/**
 * 创建行程概览元素
 */
function createOverviewElement(trip: TripData): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '210mm';
  div.style.minHeight = '297mm';
  div.style.padding = '40px';
  div.style.boxSizing = 'border-box';
  div.style.backgroundColor = '#ffffff';
  div.style.fontFamily = 'Arial, sans-serif';

  const startDate = dayjs(trip.startDate).format('YYYY年MM月DD日');
  const endDate = dayjs(trip.endDate).format('YYYY年MM月DD日');
  const days = dayjs(trip.endDate).diff(dayjs(trip.startDate), 'day') + 1;

  div.innerHTML = `
    <h2 style="font-size: 32px; margin: 0 0 10px 0; color: #333;">📋 行程概览</h2>
    <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); margin-bottom: 30px;"></div>

    <!-- 基本信息 -->
    <div style="background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
      <h3 style="font-size: 20px; margin: 0 0 20px 0; color: #667eea;">🎯 基本信息</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="font-size: 14px; margin: 0 0 5px 0; color: #999;">目的地</p>
          <p style="font-size: 18px; margin: 0; color: #333; font-weight: 500;">📍 ${trip.destination}</p>
        </div>
        <div>
          <p style="font-size: 14px; margin: 0 0 5px 0; color: #999;">行程天数</p>
          <p style="font-size: 18px; margin: 0; color: #333; font-weight: 500;">📅 ${days}天</p>
        </div>
        <div>
          <p style="font-size: 14px; margin: 0 0 5px 0; color: #999;">出发日期</p>
          <p style="font-size: 18px; margin: 0; color: #333; font-weight: 500;">🚀 ${startDate}</p>
        </div>
        <div>
          <p style="font-size: 14px; margin: 0 0 5px 0; color: #999;">返回日期</p>
          <p style="font-size: 18px; margin: 0; color: #333; font-weight: 500;">🏠 ${endDate}</p>
        </div>
      </div>
    </div>

    <!-- 每日行程概览 -->
    <div style="background: #fff; padding: 25px; border-radius: 12px; border: 1px solid #e8e8e8;">
      <h3 style="font-size: 20px; margin: 0 0 20px 0; color: #667eea;">📅 每日行程</h3>
      ${trip.days.map((day, index) => `
        <div style="padding: 15px 0; ${index < trip.days.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <p style="font-size: 18px; margin: 0; color: #333; font-weight: 600;">第${day.dayNumber}天</p>
            <p style="font-size: 14px; margin: 0; color: #999;">${dayjs(day.date).format('MM月DD日')}</p>
          </div>
          <p style="font-size: 14px; margin: 0; color: #666; line-height: 1.6;">
            ${day.itineraryItems.map(item => item.name).join(' → ')}
          </p>
          ${day.restaurantName ? `<p style="font-size: 13px; margin: 8px 0 0 0; color: #52c41a;">🍽️ ${day.restaurantName}</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  return div;
}

/**
 * 创建住宿餐饮元素
 */
function createAccommodationElement(trip: TripData): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '210mm';
  div.style.minHeight = '297mm';
  div.style.padding = '40px';
  div.style.boxSizing = 'border-box';
  div.style.backgroundColor = '#ffffff';
  div.style.fontFamily = 'Arial, sans-serif';

  let content = `
    <h2 style="font-size: 32px; margin: 0 0 10px 0; color: #333;">🏨 住宿与餐饮</h2>
    <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); margin-bottom: 30px;"></div>
  `;

  // 酒店信息
  if (trip.hotelName) {
    content += `
      <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #ff4d4f;">
        <h3 style="font-size: 20px; margin: 0 0 15px 0; color: #ff4d4f;">🏨 住宿信息</h3>
        <div style="background: #fff; padding: 20px; border-radius: 8px;">
          <h4 style="font-size: 22px; margin: 0 0 15px 0; color: #333;">${trip.hotelName}</h4>
          ${trip.hotelAddress ? `<p style="font-size: 15px; margin: 0 0 10px 0; color: #666;">📍 ${trip.hotelAddress}</p>` : ''}
          ${trip.hotelType ? `<p style="font-size: 15px; margin: 0 0 10px 0; color: #666;">🏷️ ${trip.hotelType}</p>` : ''}
          ${trip.hotelRating ? `<p style="font-size: 15px; margin: 0 0 10px 0; color: #ff8c00;">⭐ 评分: ${trip.hotelRating}</p>` : ''}
          ${trip.hotelTel ? `<p style="font-size: 15px; margin: 0; color: #666;">📞 ${trip.hotelTel}</p>` : ''}
        </div>
      </div>
    `;
  }

  // 餐厅信息
  const restaurants = trip.days.filter(d => d.restaurantName);
  if (restaurants.length > 0) {
    content += `
      <div style="background: linear-gradient(135deg, #f0fff4 0%, #e6ffed 100%); padding: 25px; border-radius: 12px; border-left: 4px solid #52c41a;">
        <h3 style="font-size: 20px; margin: 0 0 15px 0; color: #52c41a;">🍽️ 餐饮安排</h3>
        ${restaurants.map((day, index) => `
          <div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: ${index < restaurants.length - 1 ? '15px' : '0'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="font-size: 18px; margin: 0; color: #333;">${day.restaurantName}</h4>
              <span style="font-size: 13px; color: #999; background: #f5f5f5; padding: 4px 10px; border-radius: 12px;">第${day.dayNumber}天</span>
            </div>
            ${day.restaurantAddress ? `<p style="font-size: 14px; margin: 0 0 5px 0; color: #666;">📍 ${day.restaurantAddress}</p>` : ''}
            ${day.restaurantType ? `<p style="font-size: 14px; margin: 0 0 5px 0; color: #666;">🏷️ ${day.restaurantType}</p>` : ''}
            ${day.restaurantRating ? `<p style="font-size: 14px; margin: 0; color: #ff8c00;">⭐ 评分: ${day.restaurantRating}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  div.innerHTML = content;
  return div;
}

/**
 * 创建每日行程元素
 */
function createDayElement(day: DayData, trip: TripData): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '210mm';
  div.style.minHeight = '297mm';
  div.style.padding = '40px';
  div.style.boxSizing = 'border-box';
  div.style.backgroundColor = '#ffffff';
  div.style.fontFamily = 'Arial, sans-serif';

  const dayColor = ['#667eea', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'][day.dayNumber % 5];

  div.innerHTML = `
    <!-- 标题 -->
    <div style="margin-bottom: 30px;">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div style="width: 50px; height: 50px; background: ${dayColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: bold; margin-right: 15px;">
          ${day.dayNumber}
        </div>
        <div>
          <h2 style="font-size: 28px; margin: 0; color: #333;">第${day.dayNumber}天</h2>
          <p style="font-size: 14px; margin: 5px 0 0 0; color: #999;">${dayjs(day.date).format('YYYY年MM月DD日')}</p>
        </div>
      </div>
      <div style="width: 100%; height: 3px; background: linear-gradient(90deg, ${dayColor} 0%, transparent 100%);"></div>
    </div>

    <!-- 景点列表 -->
    <div style="margin-bottom: 30px;">
      ${day.itineraryItems.map((item, index) => `
        <div style="background: #fafafa; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid ${dayColor};">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div style="flex: 1;">
              <h3 style="font-size: 20px; margin: 0 0 8px 0; color: #333;">${item.name}</h3>
              <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <span style="font-size: 14px; color: #666;">🕐 ${dayjs(item.startTime).format('HH:mm')} - ${dayjs(item.endTime).format('HH:mm')}</span>
                ${item.category ? `<span style="font-size: 14px; color: #666;">🏷️ ${item.category}</span>` : ''}
                ${item.cost > 0 ? `<span style="font-size: 14px; color: #ff8c00;">💰 ¥${item.cost}</span>` : ''}
              </div>
            </div>
          </div>
          ${item.description ? `<p style="font-size: 14px; margin: 10px 0 0 0; color: #666; line-height: 1.6;">${item.description}</p>` : ''}
          ${item.address ? `<p style="font-size: 13px; margin: 8px 0 0 0; color: #999;">📍 ${item.address}</p>` : ''}
        </div>
      `).join('')}
    </div>

    <!-- 餐厅信息 -->
    ${day.restaurantName ? `
      <div style="background: linear-gradient(135deg, #f0fff4 0%, #e6ffed 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #52c41a;">
        <h3 style="font-size: 18px; margin: 0 0 10px 0; color: #52c41a;">🍽️ 午餐推荐</h3>
        <h4 style="font-size: 20px; margin: 0 0 10px 0; color: #333;">${day.restaurantName}</h4>
        ${day.restaurantAddress ? `<p style="font-size: 14px; margin: 0 0 5px 0; color: #666;">📍 ${day.restaurantAddress}</p>` : ''}
        ${day.restaurantType ? `<p style="font-size: 14px; margin: 0 0 5px 0; color: #666;">🏷️ ${day.restaurantType}</p>` : ''}
        ${day.restaurantRating ? `<p style="font-size: 14px; margin: 0; color: #ff8c00;">⭐ 评分: ${day.restaurantRating}</p>` : ''}
      </div>
    ` : ''}
  `;

  return div;
}

/**
 * 创建预算汇总元素
 */
function createBudgetElement(budget: BudgetData, totalBudget: number): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '210mm';
  div.style.minHeight = '297mm';
  div.style.padding = '40px';
  div.style.boxSizing = 'border-box';
  div.style.backgroundColor = '#ffffff';
  div.style.fontFamily = 'Arial, sans-serif';

  const items = [
    { name: '交通', value: budget.transportation, icon: '🚗', color: '#1890ff' },
    { name: '住宿', value: budget.accommodation, icon: '🏨', color: '#ff4d4f' },
    { name: '餐饮', value: budget.food, icon: '🍽️', color: '#52c41a' },
    { name: '门票', value: budget.tickets, icon: '🎫', color: '#fa8c16' },
    { name: '购物', value: budget.shopping, icon: '🛍️', color: '#eb2f96' },
    { name: '其他', value: budget.other, icon: '📦', color: '#722ed1' },
  ].filter(item => item.value > 0);

  const total = items.reduce((sum, item) => sum + item.value, 0);

  div.innerHTML = `
    <h2 style="font-size: 32px; margin: 0 0 10px 0; color: #333;">💰 预算汇总</h2>
    <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); margin-bottom: 30px;"></div>

    <!-- 总预算 -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; color: #fff;">
      <p style="font-size: 16px; margin: 0 0 10px 0; opacity: 0.9;">总预算</p>
      <p style="font-size: 48px; margin: 0; font-weight: bold;">¥${totalBudget.toLocaleString()}</p>
      <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.8;">预计花费: ¥${total.toLocaleString()}</p>
    </div>

    <!-- 预算明细 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      ${items.map(item => `
        <div style="background: #fafafa; padding: 20px; border-radius: 12px; border-left: 4px solid ${item.color};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-size: 14px; margin: 0 0 5px 0; color: #999;">${item.icon} ${item.name}</p>
              <p style="font-size: 24px; margin: 0; color: #333; font-weight: 600;">¥${item.value.toLocaleString()}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; margin: 0; color: ${item.color};">${((item.value / total) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- 底部提示 -->
    <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
      <p style="font-size: 14px; margin: 0; color: #666;">💡 预算仅供参考,实际花费可能因市场波动而有所变化</p>
    </div>
  `;

  return div;
}
