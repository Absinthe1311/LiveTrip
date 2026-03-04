// 预算图表组件 - 显示预算分配和实际开销
import ReactECharts from 'echarts-for-react';
import { Card, Alert, Progress, Statistic, Row, Col, Tag } from 'antd';
import { WarningOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface BudgetChartProps {
  data: { category: string; amount: number }[]; // 预估预算数据
  totalBudget?: number;
  actualBudget?: {
    accommodation: number;
    dining: number;
    transportation: number;
    tickets: number;
    total: number;
  };
  warningMessage?: string;
  warningLevel?: number; // 0-无预警，1-黄色，2-橙色，3-红色
}

export default function BudgetChart({
  data,
  totalBudget = 10000,
  actualBudget,
  warningMessage,
  warningLevel = 0
}: BudgetChartProps) {
  // 预估预算数据（用于对比）
  const estimatedData = data.map(item => ({
    name: item.category,
    estimated: item.amount,
  }));

  // 如果有实际预算，使用实际预算数据
  const hasActualData = actualBudget && actualBudget.total > 0;
  const chartData = hasActualData ? [
    { value: actualBudget.accommodation, name: '住宿', estimated: estimatedData.find(d => d.name === '住宿')?.estimated || 0 },
    { value: actualBudget.dining, name: '餐饮', estimated: estimatedData.find(d => d.name === '餐饮')?.estimated || 0 },
    { value: actualBudget.transportation, name: '交通', estimated: estimatedData.find(d => d.name === '交通')?.estimated || 0 },
    { value: actualBudget.tickets, name: '门票', estimated: estimatedData.find(d => d.name === '门票')?.estimated || 0 },
  ] : data.map(item => ({
    value: item.amount,
    name: item.category,
    estimated: item.amount,
  }));

  const totalActual = hasActualData ? actualBudget.total : data.reduce((sum, item) => sum + item.amount, 0);
  const totalEstimated = data.reduce((sum, item) => sum + item.amount, 0);
  const usageRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalActual;

  // 预算状态
  let budgetStatus: 'success' | 'warning' | 'error' = 'success';
  let statusIcon = <CheckCircleOutlined />;
  let statusText = '预算充足';

  if (usageRate > 100) {
    budgetStatus = 'error';
    statusIcon = <CloseCircleOutlined />;
    statusText = '预算超支';
  } else if (usageRate > 95) {
    budgetStatus = 'warning';
    statusIcon = <WarningOutlined />;
    statusText = '预算紧张';
  }

  // 获取预警颜色
  const getWarningColor = (level: number) => {
    switch (level) {
      case 1: return '#faad14'; // 黄色
      case 2: return '#fa8c16'; // 橙色
      case 3: return '#f5222d'; // 红色
      default: return 'transparent';
    }
  };

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const diff = params.data.value - params.data.estimated;
        const diffText = diff > 0 ? ` +¥${diff}` : diff < 0 ? ` -¥${Math.abs(diff)}` : '';
        return `${params.data.name}: ¥${params.data.value} (${params.percent}%)${diffText}`;
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    color: ['#91cc75', '#fac858', '#ee6666', '#73c0de'],
    series: [
      {
        name: '预算分配',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData
      }
    ]
  };

  return (
    <div style={{
      background: '#fff',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: '#333'
        }}>
          预算分配
        </h2>
        {hasActualData && <Tag color="blue">实时预算</Tag>}
      </div>

      {/* 预算预警 */}
      {warningLevel > 0 && warningMessage && (
        <Alert
          message={warningMessage}
          type={warningLevel === 3 ? 'error' : warningLevel === 2 ? 'warning' : 'warning'}
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 预算总览 */}
      <Card size="small" style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总预算"
              value={totalBudget}
              prefix="¥"
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际开销"
              value={totalActual}
              prefix="¥"
              valueStyle={{
                fontSize: '18px',
                color: totalActual > totalBudget ? '#f5222d' : '#52c41a'
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="预算余额"
              value={remaining}
              prefix="¥"
              valueStyle={{
                fontSize: '18px',
                color: remaining >= 0 ? '#52c41a' : '#f5222d'
              }}
            />
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                预算状态
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: budgetStatus === 'success' ? '#52c41a' :
                       budgetStatus === 'warning' ? '#faad14' : '#f5222d'
              }}>
                {statusIcon} {statusText}
              </div>
              <Progress
                percent={Math.min(usageRate, 100)}
                status={budgetStatus}
                strokeColor={getWarningColor(warningLevel) || undefined}
                showInfo={false}
                style={{ marginTop: '8px' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <ReactECharts option={option} style={{ height: '300px' }} />

      <div style={{
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {chartData.map((item: any, index: number) => {
          const diff = item.value - item.estimated;
          const diffText = diff > 0 ? `+¥${diff}` : diff < 0 ? `-¥${Math.abs(diff)}` : '¥0';
          const diffColor = diff > 0 ? '#f5222d' : diff < 0 ? '#52c41a' : '#999';

          return (
            <div key={index} style={{
              flex: '1 1 calc(50% - 12px)',
              minWidth: '140px',
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '4px'
              }}>
                {item.name}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#333',
                marginBottom: '4px'
              }}>
                ¥{item.value}
              </div>
              {hasActualData && (
                <div style={{
                  fontSize: '12px',
                  color: diffColor,
                  fontWeight: 500
                }}>
                  vs 预估: {diffText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
