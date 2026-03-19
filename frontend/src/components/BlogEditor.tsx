import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Upload, message, Spin, Tag } from 'antd';
import { UploadOutlined, PlusOutlined, BookOutlined } from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { createBlog, updateBlog, getBlogPostById } from '../api/client';
import type { UploadFile } from 'antd/es/upload/interface';

interface BlogEditorProps {
  visible: boolean;
  postId?: string;
  userId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function BlogEditor({ visible, postId, userId = 'default-user', onCancel, onSuccess }: BlogEditorProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  const [content, setContent] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      setIsEditMode(true);
      loadBlogData(postId);
    } else if (visible) {
      setIsEditMode(false);
      form.resetFields();
      setTags([]);
      setContent('');
      setFileList([]);
    }
  }, [visible, postId]);

  const loadBlogData = async (id: string) => {
    try {
      setLoading(true);
      const response = await getBlogPostById(id);
      
      if (response.success && response.data) {
        const blog = response.data;
        form.setFieldsValue({
          title: blog.title,
          city: blog.city,
          isPublished: blog.isPublished,
        });
        
        if (blog.tags) {
          setTags(blog.tags.split(',').filter((t: string) => t.trim()));
        }
        
        setContent(blog.content || '');
        
        if (blog.coverImage) {
          setFileList([{
            uid: '-1',
            name: 'cover.jpg',
            status: 'done',
            url: blog.coverImage,
          }]);
        }
      }
    } catch (error: any) {
      message.error('加载博客数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // 验证用户 ID
      if (!userId || userId === 'default-user') {
        message.warning('请先登录后再发布博客');
        return;
      }

      const coverImage = fileList.length > 0
        ? (fileList[0].response?.url || fileList[0].url)
        : undefined;

      const blogData = {
        userId,
        title: values.title,
        content: content,
        coverImage,
        tags: tags,
        city: values.city,
        isPublished: true,  // 直接设置为已发布
      };

      console.log('📝 发布博客数据:', blogData);

      if (isEditMode && postId) {
        await updateBlog(postId, userId, blogData);
        message.success('博客更新成功！');
      } else {
        const response = await createBlog(blogData);
        console.log('✅ 博客发布响应:', response);
        message.success('博客发布成功！');
      }

      form.resetFields();
      setTags([]);
      setContent('');
      setFileList([]);
      onSuccess();
    } catch (error: any) {
      console.error('❌ 博客发布失败:', error);
      message.error(error.response?.data?.message || error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Modal
      title={isEditMode ? '编辑博客' : '创建博客'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input
              placeholder="给你的博客起个标题"
              style={{ fontSize: 16, fontWeight: 500 }}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>内容</div>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={500}
                preview="live"
                hideToolbar={false}
                visibleDragBar={false}
                extraCommands={[]}
              />
            </div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              支持 Markdown 语法：**加粗**、*斜体*、# 标题、- 列表、[链接](url)等
            </div>
          </div>

          <Form.Item
            label="封面图片"
            name="coverImage"
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList.slice(0, 1))}
              beforeUpload={() => false}
              accept="image/*"
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传封面</div>
                </div>
              )}
            </Upload>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              建议尺寸：1200x630px，支持jpg、png等格式
            </div>
          </Form.Item>

          <Form.Item label="标签">
            <div style={{ marginBottom: 8 }}>
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  color="blue"
                  style={{ marginBottom: 8 }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="输入标签，按回车添加"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onPressEnter={handleAddTag}
                style={{ flex: 1 }}
              />
              <Button icon={<PlusOutlined />} onClick={handleAddTag}>
                添加
              </Button>
            </div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              建议标签：美食、景点、拍照、攻略、住宿、交通
            </div>
          </Form.Item>

          <Form.Item
            label="相关城市"
            name="city"
          >
            <Input placeholder="例如：北京、上海" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<BookOutlined />}
            >
              {isEditMode ? '更新博客' : '发布博客'}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}