/**
 * 分享按钮组件
 * 用于生成行程分享链接
 */

import React, { useState } from 'react';
import { Button, Modal, Input, message, QRCode, Space } from 'antd';
import { ShareAltOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { shareTrip } from '../../api/client';

interface ShareButtonProps {
  tripId: string;
  style?: React.CSSProperties;
}

const ShareButton: React.FC<ShareButtonProps> = ({ tripId, style }) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // 生成分享链接
  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await shareTrip(tripId);
      if (response.success) {
        setShareUrl(response.data.shareUrl);
        setModalVisible(true);
        message.success('分享链接生成成功');
      } else {
        message.error(response.error || '生成分享链接失败');
      }
    } catch (error: any) {
      console.error('分享失败:', error);
      message.error(error.response?.data?.error || '生成分享链接失败,请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制链接到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      message.error('复制失败,请手动复制');
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<ShareAltOutlined />}
        onClick={handleShare}
        loading={loading}
        style={style}
      >
        分享行程
      </Button>

      <Modal
        title="分享行程"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            通过以下链接分享您的行程,任何人都可以查看(只读)
          </p>

          <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
            <Input
              value={shareUrl}
              readOnly
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? '已复制' : '复制'}
            </Button>
          </Space.Compact>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ marginBottom: 16, color: '#666' }}>或扫描二维码分享</p>
            <QRCode value={shareUrl} size={200} />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ShareButton;

