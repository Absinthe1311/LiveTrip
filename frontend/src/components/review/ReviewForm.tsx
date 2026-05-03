import { useState, useEffect } from 'react';
import { Modal, Form, Input, Rate, Button, Upload, message, Spin, Empty } from 'antd';
import { UploadOutlined, StarOutlined } from '@ant-design/icons';
import { createReview, getSpotReviews } from '../../api/client';
import type { UploadFile } from 'antd/es/upload/interface';

interface ReviewFormProps {
  visible: boolean;
  spotId: string;
  spotName: string;
  onCancel: () => void;
  onSuccess: () => void;
  userId?: string;
}

export default function ReviewForm({
  visible,
  spotId,
  spotName,
  onCancel,
  onSuccess,
  userId = 'default-user',
}: ReviewFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // 获取图片URLs
      const imageUrls = fileList
        .filter((file) => file.status === 'done')
        .map((file) => file.response?.url || file.url);

      await createReview({
        spotId,
        userId,
        rating: values.rating,
        comment: values.comment,
        images: imageUrls,
      });

      message.success('评价提交成功！');
      form.resetFields();
      setFileList([]);
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || '评价提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`评价 ${spotName}`} open={visible} onCancel={onCancel} footer={null} width={600}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ rating: 5 }}>
        <Form.Item label="评分" name="rating" rules={[{ required: true, message: '请选择评分' }]}>
          <Rate allowHalf character={<StarOutlined />} style={{ fontSize: 24 }} />
        </Form.Item>

        <Form.Item
          label="评价内容"
          name="comment"
          rules={[{ required: true, message: '请输入评价内容' }]}
        >
          <Input.TextArea rows={4} placeholder="分享您的游览体验..." maxLength={500} showCount />
        </Form.Item>

        <Form.Item label="上传图片" name="images">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            accept="image/*"
            maxCount={5}
          >
            {fileList.length < 5 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
            最多上传5张图片，支持jpg、png等格式
          </div>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交评价
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
