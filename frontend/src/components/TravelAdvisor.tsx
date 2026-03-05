// 旅行规划顾问组件
import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, message, Avatar, Spin, Tag, Space } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, QuestionCircleOutlined } from '@ant-design/icons';

interface TravelAdvisorProps {
  planContext?: {
    origin?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    groupSize?: number;
    preferences?: string[];
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TravelAdvisor({ planContext }: TravelAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 快捷问题
  const quickQuestions = [
    '这个预算够吗？',
    '有哪些必去景点？',
    '推荐当地美食',
    '如何节省费用？',
    '最佳游览时间？',
  ];

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // 调用后端AI顾问API
      const response = await fetch('http://localhost:3003/api/advisor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: content,
          planContext,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.answer) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('❌ AI顾问请求失败:', error);
      message.error(error.message || 'AI顾问暂时无法使用，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 处理快捷问题点击
  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  // 构建规划信息摘要
  const renderPlanSummary = () => {
    if (!planContext) return null;

    const items = [];

    if (planContext.destination) {
      items.push(<Tag key="dest" color="blue">目的地: {planContext.destination}</Tag>);
    }
    if (planContext.startDate && planContext.endDate) {
      items.push(<Tag key="date" color="green">日期: {planContext.startDate} 至 {planContext.endDate}</Tag>);
    }
    if (planContext.budget) {
      items.push(<Tag key="budget" color="orange">预算: ¥{planContext.budget}</Tag>);
    }
    if (planContext.groupSize) {
      items.push(<Tag key="group" color="purple">人数: {planContext.groupSize}人</Tag>);
    }
    if (planContext.preferences && planContext.preferences.length > 0) {
      items.push(<Tag key="pref" color="cyan">偏好: {planContext.preferences.join(', ')}</Tag>);
    }

    if (items.length === 0) return null;

    return (
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '6px',
      }}>
        <div style={{
          fontSize: '13px',
          color: '#666',
          marginBottom: '8px',
        }}>
          <QuestionCircleOutlined style={{ marginRight: '4px' }} />
          您的规划信息
        </div>
        <Space wrap>
          {items}
        </Space>
      </div>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>旅行规划顾问</span>
        </div>
      }
      style={{
        height: '100%',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '16px',
      }}
    >
      {/* 规划信息摘要 */}
      {renderPlanSummary()}

      {/* 消息列表 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '16px',
          padding: '8px',
          background: '#fafafa',
          borderRadius: '6px',
          minHeight: '300px',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              textAlign: 'center',
            }}
          >
            <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <p>我是您的旅行规划顾问</p>
            <p style={{ fontSize: '13px' }}>有什么问题尽管问我，我会根据您的规划给出专业建议！</p>

            {/* 快捷问题 */}
            {planContext && (
              <div style={{ marginTop: '24px', width: '100%' }}>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  常见问题：
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {quickQuestions.map((question) => (
                    <Button
                      key={question}
                      size="small"
                      type="text"
                      style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '16px',
                      }}
                      onClick={() => handleQuickQuestion(question)}
                      disabled={loading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                marginBottom: '16px',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  maxWidth: '80%',
                  alignItems: 'flex-start',
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar
                    size="small"
                    icon={<RobotOutlined />}
                    style={{
                      background: '#1890ff',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: message.role === 'user' ? '#1890ff' : '#fff',
                    color: message.role === 'user' ? '#fff' : '#333',
                    border: message.role === 'assistant' ? '1px solid #e8e8e8' : 'none',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{
                      background: '#52c41a',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Spin tip="AI正在思考..." />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Input
          placeholder="请输入您的问题..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={() => handleSendMessage(inputValue)}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleSendMessage(inputValue)}
          disabled={loading || !inputValue.trim()}
        >
          发送
        </Button>
      </div>
    </Card>
  );
}
