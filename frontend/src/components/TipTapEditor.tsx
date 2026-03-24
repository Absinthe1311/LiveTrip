import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Upload, message } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = '开始编写你的旅行故事...',
  height = 500,
}: TipTapEditorProps) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
        style: `min-height: ${height}px`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  // 图片上传处理
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      // 使用FormData上传到Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'livetrip_blog');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dbfuvkopc/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('图片上传失败');
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      // 插入图片到编辑器
      editor.chain().focus().setImage({ src: imageUrl }).run();

      message.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      message.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 添加链接
  const addLink = () => {
    const url = window.prompt('请输入链接地址');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // 工具栏按钮样式
  const toolbarButtonClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded border transition-colors ${
      isActive
        ? 'bg-blue-500 text-white border-blue-500'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* 工具栏 */}
      <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-2">
        {/* 标题 */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 1 }))}
            title="一级标题"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 2 }))}
            title="二级标题"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 3 }))}
            title="三级标题"
          >
            H3
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* 格式化 */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarButtonClass(editor.isActive('bold'))}
            title="加粗"
          >
            <BoldOutlined />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarButtonClass(editor.isActive('italic'))}
            title="斜体"
          >
            <ItalicOutlined />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={toolbarButtonClass(editor.isActive('blockquote'))}
            title="引用"
          >
            "
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* 列表 */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={toolbarButtonClass(editor.isActive('bulletList'))}
            title="无序列表"
          >
            <UnorderedListOutlined />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClass(editor.isActive('orderedList'))}
            title="有序列表"
          >
            <OrderedListOutlined />
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* 插入 */}
        <div className="flex gap-1">
          <button
            onClick={addLink}
            className={toolbarButtonClass(editor.isActive('link'))}
            title="插入链接"
          >
            <LinkOutlined />
          </button>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImageUpload(file);
              return false;
            }}
          >
            <button
              className={toolbarButtonClass(false)}
              title="上传图片"
              disabled={uploading}
            >
              <PictureOutlined />
            </button>
          </Upload>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={toolbarButtonClass(false)}
            title="分割线"
          >
            <MinusOutlined />
          </button>
        </div>

        {/* 撤销/重做 */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="px-3 py-1.5 rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="撤销"
          >
            撤销
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="px-3 py-1.5 rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="重做"
          >
            重做
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <EditorContent editor={editor} />

      {/* 底部提示 */}
      <div className="border-t border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-500">
        支持富文本编辑：标题、加粗、斜体、引用、列表、链接、图片等
      </div>
    </div>
  );
}
