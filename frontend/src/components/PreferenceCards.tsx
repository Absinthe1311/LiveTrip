import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Space } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

interface Preference {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface PreferenceCardsProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxSelect?: number;
}

const PREFERENCES: Preference[] = [
  { value: '历史文化', label: '历史文化', icon: '🏛️', color: '#667eea' },
  { value: '自然风光', label: '自然风光', icon: '🌲', color: '#52c41a' },
  { value: '美食探索', label: '美食探索', icon: '🍜', color: '#faad14' },
  { value: '城市体验', label: '城市体验', icon: '🏙️', color: '#1890ff' },
  { value: '休闲度假', label: '休闲度假', icon: '🏖️', color: '#13c2c2' },
  { value: '户外探险', label: '户外探险', icon: '🧗', color: '#722ed1' },
  { value: '购物娱乐', label: '购物娱乐', icon: '🛍️', color: '#eb2f96' },
  { value: '艺术文化', label: '艺术文化', icon: '🎭', color: '#fa8c16' },
];

export default function PreferenceCards({
  value,
  onChange,
  maxSelect = 3
}: PreferenceCardsProps) {
  const [selected, setSelected] = useState<string[]>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleToggle = (preference: Preference) => {
    const newSelected = [...selected];
    const index = newSelected.indexOf(preference.value);

    if (index > -1) {
      // 已选中，取消选择
      newSelected.splice(index, 1);
    } else {
      // 未选中，添加选择
      if (newSelected.length < maxSelect) {
        newSelected.push(preference.value);
      } else {
        // 超过最大选择数量，移除第一个
        newSelected.shift();
        newSelected.push(preference.value);
      }
    }

    setSelected(newSelected);
    onChange(newSelected);
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppstoreOutlined style={{ color: '#667eea' }} />
          <span style={{ fontSize: '18px', fontWeight: 600 }}>
            兴趣偏好（可多选，最多{maxSelect}个）
          </span>
        </div>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <Row gutter={[16, 16]}>
        {PREFERENCES.map(preference => {
          const isSelected = selected.includes(preference.value);
          
          return (
            <Col xs={12} sm={8} md={6} key={preference.value}>
              <Card
                hoverable
                onClick={() => handleToggle(preference)}
                style={{
                  height: '100%',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid ${preference.color}` : '2px solid #d9d9d9',
                  background: isSelected ? `${preference.color}15` : '#fff',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                bodyStyle={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <div style={{
                  fontSize: '40px',
                  marginBottom: '12px',
                  transition: 'transform 0.3s'
                }}>
                  {preference.icon}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: isSelected ? preference.color : '#333',
                  marginBottom: '8px'
                }}>
                  {preference.label}
                </div>
                {isSelected && (
                  <Tag
                    color={preference.color}
                    style={{
                      borderRadius: '12px',
                      fontWeight: 600,
                      border: 'none'
                    }}
                  >
                    已选择
                  </Tag>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {selected.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f5f7fa',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '12px',
            fontWeight: 500
          }}>
            已选择:
          </div>
          <Space wrap>
            {selected.map(value => {
              const preference = PREFERENCES.find(p => p.value === value);
              return (
                <Tag
                  key={value}
                  color={preference?.color}
                  style={{
                    fontSize: '14px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    border: 'none',
                    marginBottom: 0
                  }}
                  onClose={() => {
                    const newSelected = selected.filter(v => v !== value);
                    setSelected(newSelected);
                    onChange(newSelected);
                  }}
                  closable
                >
                  {preference?.icon} {preference?.label}
                </Tag>
              );
            })}
          </Space>
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#999'
          }}>
            还可以选择 {maxSelect - selected.length} 个偏好
          </div>
        </div>
      )}
    </Card>
  );
}
