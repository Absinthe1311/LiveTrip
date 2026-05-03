// IoT 实时检查服务 - 根据IoT数据实时检查和替换问题景点
import { RecommendedAttraction, CategoryTag } from '../types';
import { spotService } from './spotService';

class IotCheckService {
  /**
   * 实时检查行程中的景点，根据IoT数据排除或标记问题景点
   */
  async checkItinerary(
    itinerary: any[],
    groupType: string,
    hasChildren: boolean,
    hasElderly: boolean
  ): Promise<{
    checkedItinerary: any[];
    excludedSpots: Array<{ attraction: RecommendedAttraction; reason: string }>;
    warnings: Array<{ attraction: RecommendedAttraction; reason: string }>;
  }> {
    console.log('\n🔍 开始 IoT 实时检查...');

    // 确定使用的阈值
    let crowdLevelThreshold = 90;
    let rainProbabilityThreshold = 80;

    if (groupType === 'family' && hasChildren) {
      crowdLevelThreshold = 70;
      rainProbabilityThreshold = 60;
    } else if (groupType === 'family' && hasElderly) {
      crowdLevelThreshold = 70;
      rainProbabilityThreshold = 70;
    }

    const excludedSpots: Array<{ attraction: RecommendedAttraction; reason: string }> = [];
    const warnings: Array<{ attraction: RecommendedAttraction; reason: string }> = [];

    const checkedItinerary = [];
    let totalAttractions = 0;

    for (const day of itinerary) {
      const checkedAttractions: RecommendedAttraction[] = [];

      for (const attraction of day.attractions) {
        totalAttractions++;
        // 获取 IoT 数据
        const iotData = await spotService.getSpotIoTData(attraction.spotId || attraction.id);

        if (!iotData) {
          // 没有 IoT 数据，保留景点但添加警告
          warnings.push({
            attraction,
            reason: '无IoT数据',
          });
          checkedAttractions.push(attraction);
          continue;
        }

        const { crowdLevel, rainProbability, isOpen } = iotData;

        // 检查是否需要排除
        let shouldExclude = false;
        let excludeReason = '';

        // 1. 检查开放状态
        if (isOpen === false) {
          shouldExclude = true;
          excludeReason = '景点关闭';
        }
        // 2. 检查拥挤度
        else if (crowdLevel > crowdLevelThreshold) {
          shouldExclude = true;
          excludeReason = '极度拥挤';
        }
        // 3. 检查降雨概率（仅针对户外景点）
        else if (rainProbability > rainProbabilityThreshold) {
          // 检查是否为户外景点
          const isOutdoor = this.isOutdoorAttraction(attraction);
          if (isOutdoor) {
            shouldExclude = true;
            excludeReason = '恶劣天气';
          }
        }

        if (shouldExclude) {
          excludedSpots.push({
            attraction,
            reason: excludeReason,
          });
          console.log(`   ❌ 排除景点: ${attraction.name} (${excludeReason})`);
        } else {
          // 检查是否需要警告
          if (crowdLevel > 60) {
            warnings.push({
              attraction,
              reason: `拥挤度较高 (${crowdLevel}%)`,
            });
            console.log(`   ⚠️  警告: ${attraction.name} (拥挤度较高: ${crowdLevel}%)`);
          } else if (rainProbability > 50) {
            const isOutdoor = this.isOutdoorAttraction(attraction);
            if (isOutdoor) {
              warnings.push({
                attraction,
                reason: `降雨概率较高 (${rainProbability}%)`,
              });
              console.log(`   ⚠️  警告: ${attraction.name} (降雨概率较高: ${rainProbability}%)`);
            }
          }

          checkedAttractions.push(attraction);
        }
      }

      checkedItinerary.push({
        ...day,
        attractions: checkedAttractions,
      });
    }

    console.log(`✅ IoT 检查完成`);
    console.log(`   排除景点: ${excludedSpots.length} 个`);
    console.log(`   警告景点: ${warnings.length} 个`);

    // 如果所有景点都被排除了，保留原始行程
    if (totalAttractions > 0 && excludedSpots.length === totalAttractions) {
      console.log('\n⚠️  所有景点都被排除了，保留原始行程');
      return {
        checkedItinerary: itinerary,
        excludedSpots: [],
        warnings: [
          ...warnings,
          ...excludedSpots.map((e) => ({
            attraction: e.attraction,
            reason: `IoT检查建议排除(${e.reason})，但为保证行程完整性已保留`,
          })),
        ],
      };
    }

    // 如果排除的景点超过50%，也保留部分景点
    if (totalAttractions > 0 && excludedSpots.length > totalAttractions * 0.5) {
      console.log(`\n⚠️  排除景点过多 (${excludedSpots.length}/${totalAttractions})，保留部分景点`);

      // 保留被排除景点的50%
      const keepCount = Math.floor(excludedSpots.length / 2);
      const keptSpots = excludedSpots.slice(0, keepCount);

      // 将保留的景点加回行程
      for (const day of checkedItinerary) {
        for (const excludedSpot of keptSpots) {
          const shouldKeep = day.attractions.some(
            (attr: any) =>
              (attr.spotId || attr.id) ===
              (excludedSpot.attraction.spotId || excludedSpot.attraction.id)
          );

          if (!shouldKeep) {
            // 检查这个景点是否属于这一天
            const belongsToDay = itinerary[day.day - 1].attractions.some(
              (attr: any) =>
                (attr.spotId || attr.id) ===
                (excludedSpot.attraction.spotId || excludedSpot.attraction.id)
            );

            if (belongsToDay) {
              day.attractions.push(excludedSpot.attraction);
              warnings.push({
                attraction: excludedSpot.attraction,
                reason: `IoT检查建议排除(${excludedSpot.reason})，但为保证行程完整性已保留`,
              });
            }
          }
        }
      }
    }

    return {
      checkedItinerary,
      excludedSpots,
      warnings,
    };
  }

  /**
   * 判断是否为户外景点
   */
  private isOutdoorAttraction(attraction: RecommendedAttraction): boolean {
    const type = attraction.type || attraction.description || '';
    const outdoorTypes = [
      '公园',
      '风景区',
      '广场',
      '街道',
      '古镇',
      '遗迹',
      '海滩',
      '山',
      '湖',
      '海岛',
    ];

    return outdoorTypes.some((t) => type.includes(t));
  }

  /**
   * 使用备选景点替换被排除的景点
   */
  async replaceExcludedSpots(
    checkedItinerary: any[],
    excludedSpots: Array<{ attraction: RecommendedAttraction; reason: string }>,
    alternativePools: Record<string, any[]>
  ): Promise<any[]> {
    console.log('\n🔄 开始替换被排除的景点...');

    const finalItinerary = [];

    for (const day of checkedItinerary) {
      const finalAttractions: RecommendedAttraction[] = [];

      for (const attraction of day.attractions) {
        // 检查是否被排除
        const excluded = excludedSpots.find(
          (e) => e.attraction.spotId === attraction.spotId || e.attraction.id === attraction.id
        );

        if (!excluded) {
          // 景点正常，保留
          finalAttractions.push(attraction);
          continue;
        }

        // 景点被排除，尝试用备选景点替换
        const alternatives = alternativePools[attraction.spotId || attraction.id];

        if (alternatives && alternatives.length > 0) {
          // 选择评分最高的备选景点
          const bestAlternative = alternatives[0];
          const replacement = {
            id: bestAlternative.spot.id,
            spotId: bestAlternative.spot.id,
            name: bestAlternative.spot.name,
            time: attraction.time, // 保持原时间
            location: bestAlternative.spot.location,
            estimated_cost: bestAlternative.spot.ticketPrice || 0,
            description:
              bestAlternative.spot.description || bestAlternative.spot.type || '备选景点',
            type: bestAlternative.spot.type,
            address: bestAlternative.spot.address,
          };

          finalAttractions.push(replacement);
          console.log(`   ✓ 替换: ${attraction.name} → ${bestAlternative.spot.name}`);
        } else {
          // 没有备选景点，保留原景点但标记为警告
          console.log(`   ⚠️  无法替换: ${attraction.name} (无备选景点)`);
          finalAttractions.push(attraction);
        }
      }

      finalItinerary.push({
        ...day,
        attractions: finalAttractions,
      });
    }

    console.log('✅ 景点替换完成');
    return finalItinerary;
  }

  /**
   * 根据天气调整景点顺序
   * 如果上午降雨概率高，优先安排室内景点
   */
  async adjustForWeather(itinerary: any[], weatherData: any): Promise<any[]> {
    console.log('\n🌤️ 开始根据天气调整景点顺序...');

    const adjustedItinerary = [];

    for (const day of itinerary) {
      const morningAttractions: RecommendedAttraction[] = [];
      const afternoonAttractions: RecommendedAttraction[] = [];

      // 分离上午和下午的景点
      for (const attraction of day.attractions) {
        const [startHour] = attraction.time.split('-')[0].split(':').map(Number);

        if (startHour < 12) {
          morningAttractions.push(attraction);
        } else {
          afternoonAttractions.push(attraction);
        }
      }

      // 如果上午降雨概率高，交换室内外景点
      const morningRainProbability = weatherData.morning?.rainProbability || 0;

      if (morningRainProbability > 60) {
        console.log(`   上午降雨概率高 (${morningRainProbability}%)，调整景点顺序`);

        // 将室内景点移到上午，户外景点移到下午
        const indoorSpots = [...morningAttractions, ...afternoonAttractions].filter(
          (attr) => !this.isOutdoorAttraction(attr)
        );
        const outdoorSpots = [...morningAttractions, ...afternoonAttractions].filter((attr) =>
          this.isOutdoorAttraction(attr)
        );

        // 上午安排室内景点，下午安排户外景点
        const newMorning = indoorSpots.slice(0, morningAttractions.length);
        const newAfternoon = outdoorSpots.slice(0, afternoonAttractions.length);

        // 重新分配时间
        const remixedAttractions = [...newMorning, ...newAfternoon];
        const allAttractionsWithTimeSlots = this.reassignTimeSlots(remixedAttractions);

        adjustedItinerary.push({
          ...day,
          attractions: allAttractionsWithTimeSlots,
        });
      } else {
        // 降雨概率不高，保持原顺序
        adjustedItinerary.push(day);
      }
    }

    console.log('✅ 天气调整完成');
    return adjustedItinerary;
  }

  /**
   * 重新分配时间段
   */
  private reassignTimeSlots(attractions: RecommendedAttraction[]): RecommendedAttraction[] {
    if (attractions.length === 0) {
      return attractions;
    }

    let currentTime = 9 * 60; // 从 9:00 开始（分钟数）

    return attractions.map((attraction) => {
      // 解析当前景点的时间段，获取游览时长
      const [startStr, endStr] = attraction.time.split('-');
      const [startHours, startMinutes] = startStr.split(':').map(Number);
      const [endHours, endMinutes] = endStr.split(':').map(Number);
      const duration = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

      // 计算新的时间段
      const newStart = currentTime;
      const newEnd = currentTime + duration;

      // 更新当前时间（景点之间间隔 30 分钟）
      currentTime = newEnd + 30;

      return {
        ...attraction,
        time: `${this.minutesToTime(newStart)}-${this.minutesToTime(newEnd)}`,
      };
    });
  }

  /**
   * 将分钟数转换为时间字符串
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}

// 导出单例
export const iotCheckService = new IotCheckService();
