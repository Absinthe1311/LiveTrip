// 地图审图号组件 - 显示高德地图审图号
import React from 'react';

/**
 * 高德地图审图号组件
 * 
 * 根据中国地图出版管理规定，互联网地图服务必须显示审图号
 * 高德地图 JS API 2.0 官方样式会自动显示审图号
 * 此组件作为补充，确保审图号清晰可见
 * 
 * 审图号说明：
 * - 高德地图官方审图号：GS(2024)0592号
 * - 显示位置：地图右下角
 * - 格式要求：必须清晰可辨
 */
interface MapCopyrightProps {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: React.CSSProperties;
}

const MapCopyright: React.FC<MapCopyrightProps> = ({ 
  position = 'bottom-right',
  style = {} 
}) => {
  // 高德地图官方审图号
  // 来源：高德地图开放平台
  // 更新时间：2024年
  const copyrightText = 'GS(2024)0592号';
  
  // 位置样式
  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': {
      position: 'absolute',
      bottom: '8px',
      right: '8px',
    },
    'bottom-left': {
      position: 'absolute',
      bottom: '8px',
      left: '8px',
    },
    'bottom-center': {
      position: 'absolute',
      bottom: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
  };

  return (
    <div
      style={{
        ...positionStyles[position],
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: '2px 6px',
        borderRadius: '2px',
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        zIndex: 1000,
        pointerEvents: 'none',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        ...style,
      }}
    >
      {copyrightText}
    </div>
  );
};

export default MapCopyright;
