// AI辅助生成：GLM-5, 2026-3-20
// TipTap富文本编辑器增强版 - 完成编辑器升级，安装颜色、对齐等扩展
// 毛玻璃风格的Blog编辑器组件 - 适配LiveTrip UI设计（增强版）

// AI辅助生成：GLM-4, 2026-4-21
// 布局优化：两列分栏布局（左侧编辑区 + 右侧配置面板）
// 1. 将模板功能从工具栏移至右侧侧边栏
// 2. 将标签和城市输入移至右侧侧边栏
// 3. 底部操作栏简化为"取消"和"发布"两个按钮
// 4. 删除顶部工具栏，标题内嵌到编辑器区域

// 人工修复：GLM-4, 2026-4-21
// 修复问题：
// 1. 修复JSX div标签未正确闭合问题
// 2. 删除残留的孤立工具栏代码（第736-833行）
// 3. 修复封面图片区域的标签闭合错误
// 4. 确保TypeScript编译通过
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import {
  X,
  Save,
  Send,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Palette,
  FileText,
  Sparkles,
  Eye,
  Tag,
  MapPin,
  ChevronDown,
  Check,
  Upload,
  Table as TableIcon,
  Highlighter,
  CheckSquare,
  Grid3X3,
  Globe,
  BookOpen,
  Compass,
  Feather,
  Languages
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color'; // AI辅助生成：GLM-5, 2026-3-20 - 安装颜色扩展
import { TextStyle } from '@tiptap/extension-text-style'; // AI辅助生成：GLM-5, 2026-3-20 - 安装文本样式扩展
import TextAlign from '@tiptap/extension-text-align'; // AI辅助生成：GLM-5, 2026-3-20 - 安装对齐扩展
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import { Extension } from '@tiptap/core';
import GlassLayout from '../layout/GlassLayout';
import { GlassCard } from '../home';
import { createBlog, updateBlog, getBlogPostById } from '../../api/client';
import { message } from 'antd';
import ImageCropper from '../media/ImageCropper';

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
  { label: '默认', value: '' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '宋体', value: '"SimSun", serif' },
  { label: '黑体', value: '"SimHei", sans-serif' },
  { label: '楷体', value: '"KaiTi", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
];

// AI辅助生成：GLM-5, 2026-3-20 - 创建5个旅行游记预设模板
// 预设模板
const BLOG_TEMPLATES = [
  {
    id: 'travel-story',
    name: '旅行故事',
    icon: 'Globe',
    content: `<h1>🌏 [城市 + 主题]</h1>
<blockquote>📅 日期：[时间] ｜ 📍 地点：[城市] ｜ ✍️ 作者：[你的名字]</blockquote>
<h2>✨ 前言</h2>
<p>简单介绍这次旅行的背景、动机、期待。</p>
<h2>🗺️ 行程概览</h2>
<ul>
<li>Day 1：[地点]</li>
<li>Day 2：[地点]</li>
<li>Day 3：[地点]</li>
</ul>
<h2>📖 Day 1：初见[城市]</h2>
<h3>📍 去了哪里</h3>
<ul>
<li>景点1</li>
<li>景点2</li>
</ul>
<h3>🍜 吃了什么</h3>
<ul>
<li>食物1</li>
<li>食物2</li>
</ul>
<h3>💭 当天感受</h3>
<p>写你的真实体验 + 情绪 + 有趣故事</p>
<h2>📸 照片集</h2>
<p>[在这里添加照片]</p>
<h2>💡 实用攻略</h2>
<ul>
<li>交通：[交通信息]</li>
<li>住宿：[住宿建议]</li>
<li>预算：[预算信息]</li>
<li>注意事项：[注意事项]</li>
</ul>
<h2>🧭 总结</h2>
<p>一句话总结这次旅行 + 推荐指数 ⭐⭐⭐⭐</p>`,
  },
  {
    id: 'daily-diary',
    name: '旅行日记',
    icon: 'BookOpen',
    content: `<h1>📓 [城市]旅行日记 - Day X</h1>
<p>📅 日期：[YYYY-MM-DD] ｜ 🌤 天气：[晴/雨/阴] ｜ 📍 地点：[具体位置]</p>
<h2>🏨 今天从哪里开始</h2>
<p>简单描述早晨</p>
<h2>🗺️ 今天去了哪里</h2>
<ul>
<li>地点1</li>
<li>地点2</li>
</ul>
<h2>🍽️ 今天吃了什么</h2>
<ul>
<li>食物1</li>
<li>食物2</li>
</ul>
<h2>🎯 今日亮点</h2>
<p>最惊艳/最值得的一件事</p>
<h2>😅 小插曲</h2>
<p>遇到的问题或趣事</p>
<h2>💭 今日感受</h2>
<p>自由发挥（核心）</p>
<h2>⭐ 今日评分</h2>
<p>⭐⭐⭐⭐☆</p>`,
  },
  {
    id: 'complete-guide',
    name: '完整攻略',
    icon: 'Compass',
    content: `<h1>🧭 [城市]完整旅行攻略（含真实体验）</h1>
<h2>📌 基本信息</h2>
<ul>
<li>时间：[旅行时间]</li>
<li>天数：[旅行天数]</li>
<li>人均费用：[费用]</li>
<li>出行方式：[交通方式]</li>
</ul>
<h2>🗺️ 行程安排（精华版）</h2>
<table>
<tr><th>天数</th><th>行程</th></tr>
<tr><td>Day 1</td><td>[行程内容]</td></tr>
<tr><td>Day 2</td><td>[行程内容]</td></tr>
</table>
<h2>📍 景点推荐</h2>
<h3>1️⃣ 景点名称</h3>
<ul>
<li>📌 位置：[位置信息]</li>
<li>💰 门票：[门票价格]</li>
<li>⭐ 推荐指数：[评分]</li>
<li>📝 评价：[评价内容]</li>
</ul>
<h2>🍜 美食推荐</h2>
<ul>
<li>店名：[店铺名称]</li>
<li>推荐菜：[推荐菜品]</li>
<li>人均：[人均消费]</li>
</ul>
<h2>🏨 住宿建议</h2>
<ul>
<li>区域分析：[区域分析]</li>
<li>酒店推荐：[酒店推荐]</li>
</ul>
<h2>🚗 交通指南</h2>
<ul>
<li>机场 → 市区：[交通方式]</li>
<li>市内交通：[交通方式]</li>
</ul>
<h2>⚠️ 避坑指南</h2>
<ul>
<li>坑点1：[避坑建议]</li>
<li>坑点2：[避坑建议]</li>
</ul>
<h2>🧾 总结</h2>
<p>适合人群 + 是否值得去</p>`,
  },
  {
    id: 'literary-style',
    name: '文学风格',
    icon: 'Feather',
    content: `<h1>🌌 [有文学感的标题]</h1>
<blockquote>"一句引言（可以是你写的或引用）"</blockquote>
<h2>第一章：出发</h2>
<p>描述出发前的状态、心理、期待</p>
<h2>第二章：相遇</h2>
<p>描写第一个让你印象深刻的场景</p>
<h2>第三章：沉浸</h2>
<p>详细描写体验（视觉 / 听觉 / 气味）</p>
<h2>第四章：转折</h2>
<p>遇到问题 or 意外</p>
<h2>第五章：告别</h2>
<p>结束旅程</p>
<h2>尾声</h2>
<p>总结 + 升华主题</p>
<h2>📷 附录（照片/信息）</h2>
<ul>
<li>地点：[地点信息]</li>
<li>时间：[时间信息]</li>
</ul>`,
  },
  {
    id: 'english-report',
    name: '英文报告',
    icon: 'Languages',
    content: `<h1>🌍 Trip Report: [City]</h1>
<h2>📊 Overview</h2>
<ul>
<li>📅 Date: [Date]</li>
<li>⏱ Duration: [Duration]</li>
<li>💰 Budget: [Budget]</li>
<li>📍 Locations Covered: [Locations]</li>
</ul>
<h2>🧭 Timeline</h2>
<ul>
<li>Day 1: Arrival - [Description]</li>
<li>Day 2: City Tour - [Description]</li>
<li>Day 3: Departure - [Description]</li>
</ul>
<h2>📍 Highlights</h2>
<ul>
<li>Highlight 1: [Description]</li>
<li>Highlight 2: [Description]</li>
</ul>
<h2>💡 Tips</h2>
<ul>
<li>Tip 1: [Description]</li>
<li>Tip 2: [Description]</li>
</ul>
<h2>📸 Photos</h2>
<p>[Add your photos here]</p>
<h2>📝 Final Thoughts</h2>
<p>[Your final thoughts and recommendations]</p>`,
  },
];

// 预设颜色
const PRESET_COLORS = [
  '#fbbf24', // amber-400
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#ffffff', // white
  '#000000', // black
];

interface BlogEditorGlassProps {
  postId?: string;
  userId?: string;
}

export default function BlogEditorGlass({ postId, userId = 'default-user' }: BlogEditorGlassProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  const [city, setCity] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fontMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
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
          class: 'text-amber-400 underline hover:text-amber-300 cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: '开始编写你的旅行故事...',
      }),
      Color,
      TextStyle,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      // 新增扩展
      Table,
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
      CharacterCount.configure({
        limit: 50000,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px] p-8',
      },
    },
  });

  // 加载博客数据（编辑模式）
  useEffect(() => {
    if (postId) {
      setIsEditMode(true);
      loadBlogData(postId);
    }
  }, [postId]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target as Node)) {
        setShowFontMenu(false);
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setShowColorMenu(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadBlogData = async (id: string) => {
    try {
      setLoading(true);
      const response = await getBlogPostById(id);

      if (response.success && response.data) {
        const blog = response.data;
        setTitle(blog.title || '');
        setCity(blog.city || '');
        setContent(blog.content || '');
        setCoverImage(blog.coverImage || '');

        if (blog.tags) {
          setTags(blog.tags.split(',').filter((t: string) => t.trim()));
        }

        if (editor && blog.content) {
          editor.commands.setContent(blog.content);
        }
      }
    } catch (error: any) {
      message.error('加载博客数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存博客
  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      message.warning('请输入标题');
      return;
    }

    if (!content.trim()) {
      message.warning('请输入内容');
      return;
    }

    if (!userId || userId === 'default-user') {
      message.warning('请先登录后再发布博客');
      return;
    }

    try {
      setSaving(true);

      const blogData = {
        userId,
        title,
        content,
        coverImage,
        tags,
        city,
        isPublished: publish,
      };

      if (isEditMode && postId) {
        await updateBlog(postId, userId, blogData);
        message.success('博客更新成功！');
      } else {
        await createBlog(blogData);
        message.success(publish ? '博客发布成功！' : '博客保存成功！');
      }

      navigate('/blogs');
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  // 标签管理
  const handleAddTag = () => {
    if (inputTag.trim() && !tags.includes(inputTag.trim())) {
      setTags([...tags, inputTag.trim()]);
      setInputTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 封面上传
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      message.error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }

    setSelectedFile(file);
    setCropperVisible(true);
  };

  const handleCropConfirm = async (croppedImage: string) => {
    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'cover-image.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('上传失败');
      }

      const data = await uploadResponse.json();
      setCoverImage(data.url || data.data?.url);
      message.success('封面上传成功');
    } catch (error) {
      message.error('封面上传失败');
    } finally {
      setCropperVisible(false);
      setSelectedFile(null);
    }
  };

  // 图片上传到编辑器
  const handleImageUpload = async (file: File) => {
    try {
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
        throw new Error('图片上传失败');
      }

      const data = await response.json();
      const imageUrl = data.data?.url || data.url;

      if (editor && imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
        message.success('图片上传成功');
      }
    } catch (error) {
      message.error('图片上传失败');
    }
  };

  // 应用模板
  const applyTemplate = (templateId: string) => {
    const template = BLOG_TEMPLATES.find(t => t.id === templateId);
    if (template && editor) {
      editor.commands.setContent(template.content);
      setShowTemplateMenu(false);
      message.success(`已应用"${template.name}"模板`);
    }
  };

  // AI辅助生成：GLM-5, 2026-3-20 - 美化工具栏界面，按功能分组设计
  // 工具栏按钮样式
  const toolbarBtn = (isActive: boolean = false) => `
    p-2 rounded-lg transition-all duration-200
    ${isActive
      ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
    }
  `;

  if (!editor) return null;

  return (
    <GlassLayout showSearch={false}>
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex gap-6">
          {/* 左侧：编辑区 */}
          <div className="flex-1 space-y-6">
            {/* 编辑器工具栏 */}
            <GlassCard className="p-4" hover={false}>
              <div className="flex flex-wrap items-center gap-2">
                {/* 标题 */}
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={toolbarBtn(editor.isActive('heading', { level: 1 }))}
                  title="一级标题"
                >
                  <span className="font-bold text-sm">H1</span>
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={toolbarBtn(editor.isActive('heading', { level: 2 }))}
                  title="二级标题"
                >
                  <span className="font-bold text-sm">H2</span>
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={toolbarBtn(editor.isActive('heading', { level: 3 }))}
                  title="三级标题"
                >
                  <span className="font-bold text-sm">H3</span>
                </button>

                <div className="w-px h-8 bg-white/20" />

                {/* 文字格式 */}
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={toolbarBtn(editor.isActive('bold'))}
                  title="加粗"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={toolbarBtn(editor.isActive('italic'))}
                  title="斜体"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={toolbarBtn(editor.isActive('blockquote'))}
                  title="引用"
                >
                  <Quote className="w-4 h-4" />
                </button>

                {/* 字体选择 */}
                <div className="relative" ref={fontMenuRef}>
                  <button
                    onClick={() => setShowFontMenu(!showFontMenu)}
                    className={toolbarBtn()}
                    title="字体"
                  >
                    <Type className="w-4 h-4" />
                  </button>

                  {showFontMenu && (
                    <div className="absolute top-full left-0 mt-2 w-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                      {FONT_FAMILIES.map(font => (
                        <button
                          key={font.value}
                          onClick={() => {
                            if (font.value) {
                              editor.chain().focus().setFontFamily(font.value).run();
                            } else {
                              editor.chain().focus().unsetFontFamily().run();
                            }
                            setShowFontMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-white/10 text-white transition-all"
                          style={{ fontFamily: font.value || 'inherit' }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 颜色选择 */}
                <div className="relative" ref={colorMenuRef}>
                  <button
                    onClick={() => setShowColorMenu(!showColorMenu)}
                    className={toolbarBtn()}
                    title="文字颜色"
                  >
                    <Palette className="w-4 h-4" />
                  </button>

                  {showColorMenu && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-3 z-50">
                      <div className="grid grid-cols-5 gap-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              editor.chain().focus().setColor(color).run();
                              setShowColorMenu(false);
                            }}
                            className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/50 transition-all"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-px h-8 bg-white/20" />

                {/* 对齐 */}
                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={toolbarBtn(editor.isActive({ textAlign: 'left' }))}
                  title="左对齐"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={toolbarBtn(editor.isActive({ textAlign: 'center' }))}
                  title="居中"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={toolbarBtn(editor.isActive({ textAlign: 'right' }))}
                  title="右对齐"
                >
                  <AlignRight className="w-4 h-4" />
                </button>

                <div className="w-px h-8 bg-white/20" />

                {/* 列表 */}
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={toolbarBtn(editor.isActive('bulletList'))}
                  title="无序列表"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={toolbarBtn(editor.isActive('orderedList'))}
                  title="有序列表"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-8 bg-white/20" />

                {/* 插入 */}
                <button
                  onClick={() => {
                    const url = prompt('输入图片URL:');
                    if (url) {
                      editor.chain().focus().setImage({ src: url }).run();
                    }
                  }}
                  className={toolbarBtn()}
                  title="插入图片"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  className={toolbarBtn()}
                  title="分割线"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="w-px h-8 bg-white/20" />

                {/* 表格 */}
                <button
                  onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                  className={toolbarBtn()}
                  title="插入表格"
                >
                  <TableIcon className="w-4 h-4" />
                </button>

                <div className="w-px h-8 bg-white/20" />

                {/* 高亮 */}
                <button
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  className={toolbarBtn(editor.isActive('highlight'))}
                  title="高亮"
                >
                  <Highlighter className="w-4 h-4" />
                </button>

                {/* 任务列表 */}
                <button
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                  className={toolbarBtn(editor.isActive('taskList'))}
                  title="任务列表"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                <div className="w-px h-8 bg-white/20" />

                {/* 撤销/重做 */}
                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className={toolbarBtn() + ' disabled:opacity-30 disabled:cursor-not-allowed'}
                  title="撤销"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className={toolbarBtn() + ' disabled:opacity-30 disabled:cursor-not-allowed'}
                  title="重做"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>

        {/* 编辑器内容区 */}
        <GlassCard className="p-0 overflow-hidden" hover={false}>
          {/* 标题输入 - 内嵌到编辑器顶部 */}
          <div className="px-6 py-6 border-b border-white/10">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的博客起个标题..."
              className="w-full text-3xl font-bold bg-transparent border-none outline-none text-white placeholder-white/30"
            />
          </div>
          
          <div className="bg-white/5 min-h-[600px]">
            <EditorContent editor={editor} />
          </div>
          {/* 字数统计 */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-sm text-white/50">
            <div className="flex items-center gap-4">
              <span>字数：{editor.storage.characterCount?.characters?.() || 0}</span>
              <span>单词：{editor.storage.characterCount?.words?.() || 0}</span>
            </div>
            <span>限制：50,000 字</span>
          </div>
        </GlassCard>

        {/* 封面图片 */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              封面图片
            </h3>
          </div>

          {coverImage ? (
            <div className="relative group">
              <img
                src={coverImage}
                alt="封面"
                className="w-full h-64 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <button
                  onClick={() => setCoverImage('')}
                  className="px-4 py-2 rounded-lg bg-red-500/80 text-white"
                >
                  移除封面
                </button>
              </div>
            </div>
          ) : (
            <label className="block w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-amber-400/50 transition-all flex flex-col items-center justify-center gap-3">
              <Upload className="w-12 h-12 text-white/30" />
              <span className="text-white/50">点击上传封面图片</span>
              <span className="text-sm text-white/30">建议尺寸：1200x630px</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>
          )}
        </GlassCard>

        {/* 底部操作栏 - 只保留取消和发布 */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/blogs')}
              className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-2 transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
              <span>取消</span>
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>{saving ? '发布中...' : '发布'}</span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* 右侧：配置面板 */}
      <div className="w-80 space-y-6">
        {/* 模板选择 */}
        <GlassCard className="p-6" hover={false}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            选择模板
          </h3>
          <div className="space-y-2">
            {BLOG_TEMPLATES.map(template => {
              const IconComponent = template.icon === 'Globe' ? Globe :
                                   template.icon === 'BookOpen' ? BookOpen :
                                   template.icon === 'Compass' ? Compass :
                                   template.icon === 'Feather' ? Feather :
                                   Languages;
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-amber-500/10 text-left flex items-center gap-3 transition-all border border-white/10 hover:border-amber-400/30 group"
                >
                  <IconComponent className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                  <span className="text-white group-hover:text-amber-100 transition-colors">{template.name}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* 标签 */}
        <GlassCard className="p-6" hover={false}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            标签
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputTag}
              onChange={(e) => setInputTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="输入标签..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder-white/30 focus:border-amber-400/50 focus:outline-none transition-all"
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30 hover:bg-amber-500/30 transition-all text-sm"
            >
              添加
            </button>
          </div>

          <p className="text-xs text-white/40 mt-2">
            建议：美食、景点、拍照、攻略
          </p>
        </GlassCard>

        {/* 城市 */}
        <GlassCard className="p-6" hover={false}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            相关城市
          </h3>

          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="例如：北京、上海..."
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder-white/30 focus:border-amber-400/50 focus:outline-none transition-all"
          />
        </GlassCard>
      </div>
    </div>

    {/* 图片裁剪器 */}
    {cropperVisible && selectedFile && (
      <ImageCropper
        visible={cropperVisible}
        imageFile={selectedFile}
        onConfirm={handleCropConfirm}
        onCancel={() => {
          setCropperVisible(false);
          setSelectedFile(null);
        }}
      />
    )}
  </div>
</GlassLayout>
  );
}





