import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/plan');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: '24px',
      paddingTop: '88px', // Account for fixed navbar
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰图标 */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        fontSize: '60px',
        opacity: 0.1,
        animation: 'float 6s ease-in-out infinite'
      }}>
        ✈️
      </div>
      <div style={{
        position: 'absolute',
        top: '30%',
        right: '15%',
        fontSize: '50px',
        opacity: 0.1,
        animation: 'float 8s ease-in-out infinite 2s'
      }}>
        📸
      </div>
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: '15%',
        fontSize: '45px',
        opacity: 0.1,
        animation: 'float 7s ease-in-out infinite 1s'
      }}>
        🗺️
      </div>
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '10%',
        fontSize: '55px',
        opacity: 0.1,
        animation: 'float 9s ease-in-out infinite 3s'
      }}>
        🎒
      </div>

      {/* 主内容 */}
      <div style={{
        textAlign: 'center',
        zIndex: 1,
        maxWidth: '800px'
      }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: 700,
          marginBottom: '24px',
          textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'fadeInUp 1s ease-out'
        }}>
          🌍 LiveTrip 智能旅行规划
        </h1>
        
        <p style={{
          fontSize: '24px',
          marginBottom: '32px',
          opacity: 0.95,
          animation: 'fadeInUp 1s ease-out 0.2s',
          animationFillMode: 'both'
        }}>
          让 AI 为你规划完美行程
        </p>

        <div style={{
          display: 'flex',
          gap: '32px',
          justifyContent: 'center',
          marginBottom: '48px',
          flexWrap: 'wrap',
          animation: 'fadeInUp 1s ease-out 0.4s',
          animationFillMode: 'both'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px'
          }}>
            <span>✨</span>
            <span>一键生成行程</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px'
          }}>
            <span>🔄</span>
            <span>智能实时调整</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px'
          }}>
            <span>🎯</span>
            <span>个性化定制</span>
          </div>
        </div>

        <Button
          type="primary"
          size="large"
          onClick={handleStart}
          style={{
            fontSize: '20px',
            height: '60px',
            padding: '0 60px',
            borderRadius: '30px',
            background: '#fff',
            color: '#667eea',
            border: 'none',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'fadeInUp 1s ease-out 0.6s',
            animationFillMode: 'both',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
          }}
        >
          🚀 开始规划
        </Button>
      </div>

      {/* 滚动提示 */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        animation: 'bounce 2s infinite',
        cursor: 'pointer',
        opacity: 0.8
      }}>
        <div style={{ fontSize: '24px' }}>⬇️</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>了解更多</div>
      </div>

      {/* 添加全局动画样式 */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}
