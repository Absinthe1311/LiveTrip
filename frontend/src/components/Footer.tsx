import { Layout, Row, Col, Typography } from 'antd';

const { Footer } = Layout;
const { Text, Link } = Typography;

export default function FooterComponent() {
  return (
    <Footer style={{
      padding: '48px 48px 24px',
      background: '#2c3e50',
      color: '#fff'
    }}>
      <Row gutter={[48, 48]}>
        {/* 关于我们 */}
        <Col xs={24} sm={12} lg={8}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#fff'
            }}>
              关于 LiveTrip
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#bdc3c7',
              lineHeight: '1.8',
              marginBottom: 0
            }}>
              LiveTrip 是一款基于人工智能和物联网技术的智能旅行规划系统。我们致力于为用户提供个性化、智能化的旅行体验，让每一次旅行都成为美好的回忆。
            </p>
          </div>
        </Col>

        {/* 快速链接 */}
        <Col xs={24} sm={12} lg={8}>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#fff'
            }}>
              快速链接
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <Link 
                href="/plan" 
                style={{ color: '#bdc3c7', fontSize: '14px' }}
              >
                创建行程
              </Link>
              <Link 
                href="/itinerary" 
                style={{ color: '#bdc3c7', fontSize: '14px' }}
              >
                我的行程
              </Link>
              <Link 
                href="/destinations" 
                style={{ color: '#bdc3c7', fontSize: '14px' }}
              >
                热门目的地
              </Link>
              <Link 
                href="/help" 
                style={{ color: '#bdc3c7', fontSize: '14px' }}
              >
                帮助中心
              </Link>
            </div>
          </div>
        </Col>

        {/* 联系我们 */}
        <Col xs={24} sm={12} lg={8}>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#fff'
            }}>
              联系我们
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '14px', color: '#bdc3c7' }}>
                📧 contact@livetrip.com
              </div>
              <div style={{ fontSize: '14px', color: '#bdc3c7' }}>
                📞 400-888-8888
              </div>
              <div style={{ fontSize: '14px', color: '#bdc3c7' }}>
                📍 北京市朝阳区
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 底部版权信息 */}
      <div style={{
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '1px solid #34495e',
        textAlign: 'center'
      }}>
        <Text style={{ color: '#95a5a6', fontSize: '14px' }}>
          © 2026 LiveTrip. All rights reserved. | 
          <Link href="/privacy" style={{ color: '#95a5a6', marginLeft: '8px' }}>
            隐私政策
          </Link> | 
          <Link href="/terms" style={{ color: '#95a5a6', marginLeft: '8px' }}>
            使用条款
          </Link>
        </Text>
      </div>
    </Footer>
  );
}
