import { Card, Steps } from 'antd';

interface Step {
  title: string;
  icon?: React.ReactNode;
}

interface CompactProgressBarProps {
  current: number;
  steps: Step[];
}

export default function CompactProgressBar({
  current,
  steps
}: CompactProgressBarProps) {
  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        background: '#fff'
      }}
      bodyStyle={{ padding: '16px 24px' }}
    >
      <Steps
        current={current}
        size="small"
        items={steps.map((step, index) => ({
          title: step.title,
          icon: step.icon,
          status: index < current ? 'finish' : index === current ? 'process' : 'wait'
        }))}
        style={{
          marginBottom: 0
        }}
      />
    </Card>
  );
}
