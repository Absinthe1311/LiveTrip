import ReactECharts from 'echarts-for-react';

interface BudgetChartProps {
  data: { category: string; amount: number }[];
}

export default function BudgetChart({ data }: BudgetChartProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}元 ({d}%)'
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
        data: data.map(item => ({
          value: item.amount,
          name: item.category
        }))
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
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        fontWeight: 600,
        color: '#333'
      }}>
        预算分配
      </h2>
      <ReactECharts option={option} style={{ height: '300px' }} />
      <div style={{
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {data.map((item, index) => (
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
              {item.category}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333'
            }}>
              ¥{item.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
