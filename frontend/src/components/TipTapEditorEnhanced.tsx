import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { Extension } from '@tiptap/core';
import { Upload, message, Dropdown, ColorPicker, Select } from 'antd';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Quote,
  Undo2 as Undo,
  Redo as RedoIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  FileText,
  Type,
} from 'lucide-react';
import { useState } from 'react';

// 自定义字体扩展
const FontFamily = Extension.create({
  name: 'fontFamily',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: element => element.style.fontFamily?.replace(/['"]/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontFamily) {
                return {};
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        fontFamily =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontFamily }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// 字体选项
const FONT_FAMILIES = [
  { label: '默认字体', value: '' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '宋体', value: '"SimSun", serif' },
  { label: '黑体', value: '"SimHei", sans-serif' },
  { label: '楷体', value: '"KaiTi", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
];

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  onTemplateSelect?: (template: string) => void;
}

// 预设模板
const BLOG_TEMPLATES = [
  {
    id: 'classic',
    name: '经典图文游记',
    icon: '📝',
    content: `
      <h1>我的旅行故事</h1>
      <p>在这里写下你的旅行目的地和时间...</p>
      <h2>第一天：出发</h2>
      <p>描述你的出发心情和旅途开始...</p>
      <p>在这里插入一张出发时的照片</p>
      <h2>第二天：探索</h2>
      <p>记录你探索的景点和体验...</p>
      <blockquote>这里可以写一些特别的感受或引用</blockquote>
      <h2>第三天：返程</h2>
      <p>总结这次旅行的收获...</p>
    `,
  },
  {
    id: 'guide',
    name: '景点攻略',
    icon: '🗺️',
    content: `
      <h1>景点攻略标题</h1>
      <p>简要介绍这个景点...</p>
      <h2>基本信息</h2>
      <ul>
        <li>地址：填写景点地址</li>
        <li>开放时间：填写开放时间</li>
        <li>门票价格：填写价格信息</li>
      </ul>
      <h2>游览路线</h2>
      <p>推荐游览路线和时间安排...</p>
      <ol>
        <li>第一站：景点名称 - 建议游览时间</li>
        <li>第二站：景点名称 - 建议游览时间</li>
        <li>第三站：景点名称 - 建议游览时间</li>
      </ol>
      <h2>实用贴士</h2>
      <p>交通方式、注意事项、最佳拍照点等...</p>
    `,
  },
  {
    id: 'summary',
    name: '行程总结',
    icon: '✈',
    content: `
      <h1>行程总结标题</h1>
      <p>这次旅行的整体感受...</p>
      <h2>行程概览</h2>
      <ul>
        <li>目的地：填写目的地</li>
        <li>天数：填写天数</li>
        <li>总花费：填写预算</li>
      </ul>
      <h2>每日回顾</h2>
      <p>第一天：简要描述...</p>
      <p>第二天：简要描述...</p>
      <p>第三天：简要描述...</p>
      <h2>推荐景点</h2>
      <ul>
        <li>景点1 - 推荐理由</li>
        <li>景点2 - 推荐理由</li>
      </ul>
      <h2>旅行建议</h2>
      <p>给其他旅行者的建议...</p>
    `,
  },
];

export default function TipTapEditorEnhanced({
  content,
  onChange,
  placeholder = '开始编写你的旅行故事...',
  height = 500,
  onTemplateSelect,
}: TipTapEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [textColor, setTextColor] = useState<string>('#000000');
  const [fontFamily, setFontFamily] = useState<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false, // 禁用StarterKit中的link，使用我们配置的
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Color,
      TextStyle,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-3xl mx-auto focus:outline-none min-h-[500px] p-8',
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

      // 使用后端API上传图片 - 使用博客专用的上传接口
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/images/blog-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '图片上传失败');
      }

      const data = await response.json();
      const imageUrl = data.data?.url || data.url;

      if (!imageUrl) {
        throw new Error('未获取到图片URL');
      }

      editor.chain().focus().setImage({ src: imageUrl }).run();
      message.success('图片上传成功');
    } catch (error: any) {
      console.error('图片上传失败:', error);
      message.error(error.message || '图片上传失败，请重试');
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

  // 设置文字颜色
  const handleColorChange = (color: any) => {
    const hexColor = typeof color === 'string' ? color : color?.toHexString?.() || '#000000';
    setTextColor(hexColor);
    editor.chain().focus().setColor(hexColor).run();
  };

  // 设置字体
  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    if (value) {
      editor.chain().focus().setFontFamily(value).run();
    } else {
      editor.chain().focus().unsetFontFamily().run();
    }
  };

  // 应用模板
  const applyTemplate = (templateId: string) => {
    const template = BLOG_TEMPLATES.find(t => t.id === templateId);
    if (template && editor) {
      editor.commands.setContent(template.content);
      message.success(`已应用"${template.name}"模板`);
      if (onTemplateSelect) {
        onTemplateSelect(template.content);
      }
    }
  };

  // 工具栏按钮样式
  const toolbarButtonClass = (isActive: boolean, disabled: boolean = false) =>
    `p-2 rounded-lg transition-all ${
      disabled
        ? 'opacity-50 cursor-not-allowed text-gray-400'
        : isActive
        ? 'bg-blue-500 text-white shadow-sm'
        : 'hover:bg-gray-100 text-gray-700'
    }`;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* 模板选择区 */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">快速开始：</span>
          <div className="flex gap-2 ml-2">
            {BLOG_TEMPLATES.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-1.5"
              >
                <span>{template.icon}</span>
                <span>{template.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex flex-wrap items-center gap-1">
        {/* 标题组 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 1 }))}
            title="一级标题 (Ctrl+Alt+1)"
          >
            <span className="font-bold">H1</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 2 }))}
            title="二级标题 (Ctrl+Alt+2)"
          >
            <span className="font-bold">H2</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 3 }))}
            title="三级标题 (Ctrl+Alt+3)"
          >
            <span className="font-bold">H3</span>
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* 文字格式组 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarButtonClass(editor.isActive('bold'))}
            title="加粗 (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarButtonClass(editor.isActive('italic'))}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={toolbarButtonClass(editor.isActive('blockquote'))}
            title="引用"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* 字体选择器 */}
          <Dropdown
            menu={{
              items: FONT_FAMILIES.map(font => ({
                key: font.value,
                label: (
                  <div
                    style={{ fontFamily: font.value || 'inherit' }}
                    onClick={() => handleFontFamilyChange(font.value)}
                  >
                    {font.label}
                  </div>
                ),
              })),
            }}
          >
            <button
              type="button"
              className={toolbarButtonClass(false)}
              title="字体"
            >
              <Type className="w-4 h-4" />
            </button>
          </Dropdown>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'color',
                  label: (
                    <div className="p-2">
                      <ColorPicker
                        value={textColor}
                        onChange={handleColorChange}
                        showText
                        format="hex"
                      />
                    </div>
                  ),
                },
              ],
            }}
          >
            <button
              type="button"
              className={toolbarButtonClass(false)}
              title="文字颜色"
            >
              <Palette className="w-4 h-4" />
            </button>
          </Dropdown>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* 对齐组 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={toolbarButtonClass(editor.isActive({ textAlign: 'left' }))}
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={toolbarButtonClass(editor.isActive({ textAlign: 'center' }))}
            title="居中"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={toolbarButtonClass(editor.isActive({ textAlign: 'right' }))}
            title="右对齐"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* 列表组 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={toolbarButtonClass(editor.isActive('bulletList'))}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClass(editor.isActive('orderedList'))}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* 插入组 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200">
          <button
            type="button"
            onClick={addLink}
            className={toolbarButtonClass(editor.isActive('link'))}
            title="插入链接"
          >
            <LinkIcon className="w-4 h-4" />
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
              type="button"
              className={toolbarButtonClass(false, uploading)}
              title="上传图片"
              disabled={uploading}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </Upload>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={toolbarButtonClass(false)}
            title="分割线"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* 撤销/重做 */}
        <div className="flex items-center gap-1 ml-auto px-2 py-1 rounded-lg bg-white border border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={toolbarButtonClass(false, !editor.can().undo())}
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={toolbarButtonClass(false, !editor.can().redo())}
            title="重做 (Ctrl+Y)"
          >
            <RedoIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="bg-white min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {/* 底部提示 */}
      <div className="border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">提示：</span>
          支持 Markdown 快捷输入（#、##、###、-、1.、**、*等）
        </div>
        <div className="text-sm text-gray-400">
          {editor.storage.characterCount?.characters?.() || 0} 字
        </div>
      </div>
    </div>
  );
}
