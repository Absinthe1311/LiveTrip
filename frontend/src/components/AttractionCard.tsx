import { Card, Button } from 'antd';

interface AttractionCardProps {
  time: string;
  name: string;
  desc: string;
  onShowAlternatives?: () => void;
}

export default function AttractionCard({ time, name, desc, onShowAlternatives }: AttractionCardProps) {
  return (
    <Card
      hoverable
      style={{
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#1890ff',
            fontWeight: 600,
            marginBottom: 8,
            fontSize: '14px'
          }}>
            {time}
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            {name}
          </h3>
          <p style={{
            margin: 0,
            color: '#666',
            lineHeight: '1.6',
            fontSize: '14px'
          }}>
            {desc}
          </p>
        </div>
        {onShowAlternatives && (
          <Button
            type="link"
            style={{
              padding: '4px 8px',
              fontSize: '13px',
              color: '#1890ff',
              whiteSpace: 'nowrap',
              marginLeft: 16
            }}
            onClick={onShowAlternatives}
          >
            查看备选
          </Button>
        )}
      </div>
    </Card>
  );
}
