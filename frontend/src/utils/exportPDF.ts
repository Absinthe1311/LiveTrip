// AI辅助生成：GLM-5, 2026-04-21 20:15
// PDF导出工具函数

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as marked from 'marked';

// 配置marked选项

/**
 * 将Markdown内容转换为PDF
 * @param title 博客标题
 * @param content Markdown内容
 * @param author 作者名称
 * @param date 发布日期
 * @param city 城市
 */
export async function toPDF(
  title: string,
  content: string,
  author?: string,
  date?: string,
  city?: string
): Promise<void> {
  try {
    // 创建临时容器
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = '"Microsoft YaHei", "SimSun", Arial, sans-serif';
    container.style.color = '#333333';
    container.style.lineHeight = '1.8';

    // 构建HTML内容
    let htmlContent = `
      <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #145F39;">
        <h1 style="color: #145F39; font-size: 28px; margin: 0 0 20px 0; font-weight: bold;">${title}</h1>
        <div style="display: flex; flex-wrap: wrap; gap: 15px; color: #666; font-size: 14px;">
          ${
            author
              ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, #145F39, #005746); display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
              </div>
              <span style="color: #333; font-weight: 500;">${author}</span>
            </div>
          `
              : ''
          }
          ${
            date
              ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 14px; height: 14px; border: 2px solid #008F8D; border-radius: 2px; position: relative;">
                <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 1px; background: #008F8D;"></div>
                <div style="position: absolute; top: 5px; left: 2px; width: 8px; height: 1px; background: #008F8D;"></div>
                <div style="position: absolute; top: 8px; left: 2px; width: 5px; height: 1px; background: #008F8D;"></div>
              </div>
              <span>${date}</span>
            </div>
          `
              : ''
          }
          ${
            city
              ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 14px; height: 14px; position: relative;">
                <div style="position: absolute; top: 0; left: 5px; width: 4px; height: 4px; border-radius: 50%; background: #145F39;"></div>
                <div style="position: absolute; top: 4px; left: 3px; width: 8px; height: 8px; border: 2px solid #145F39; border-radius: 0 0 50% 50%; border-top: none;"></div>
              </div>
              <span>${city}</span>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;

    // 将Markdown转换为HTML
    const contentHtml = marked.marked(content) as string;
    htmlContent += `<div class="markdown-content">${contentHtml}</div>`;

    // 添加页脚
    htmlContent += `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #CDEDDE; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 8px; color: #145F39; font-size: 14px; font-weight: 500;">
          <div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #145F39, #005746); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
          </div>
          <span>LiveTrip</span>
        </div>
        <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">生成时间：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    `;

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // 添加Markdown样式
    const style = document.createElement('style');
    style.textContent = `
      .markdown-content h1 {
        color: #145F39;
        font-size: 24px;
        margin: 30px 0 20px 0;
        padding-bottom: 10px;
        border-bottom: 2px solid #CDEDDE;
        font-weight: bold;
      }
      .markdown-content h2 {
        color: #005746;
        font-size: 20px;
        margin: 25px 0 15px 0;
        padding-left: 12px;
        border-left: 4px solid #008F8D;
        font-weight: bold;
      }
      .markdown-content h3 {
        color: #008F8D;
        font-size: 18px;
        margin: 20px 0 12px 0;
        font-weight: bold;
      }
      .markdown-content p {
        margin: 12px 0;
        text-align: justify;
        line-height: 1.8;
        color: #333;
      }
      .markdown-content ul, .markdown-content ol {
        margin: 15px 0;
        padding-left: 30px;
        line-height: 1.8;
      }
      .markdown-content li {
        margin: 8px 0;
        color: #333;
      }
      .markdown-content blockquote {
        border-left: 4px solid #145F39;
        padding: 15px 20px;
        margin: 20px 0;
        background: linear-gradient(to right, #CDEDDE20, #ffffff);
        color: #555;
        border-radius: 0 8px 8px 0;
        font-style: italic;
      }
      .markdown-content code {
        background: #f5f5f5;
        padding: 3px 8px;
        border-radius: 4px;
        font-family: "Courier New", Consolas, monospace;
        color: #d63384;
        font-size: 0.9em;
      }
      .markdown-content pre {
        background: #2d2d2d;
        padding: 20px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 20px 0;
        color: #f8f8f2;
        font-family: "Courier New", Consolas, monospace;
        line-height: 1.6;
      }
      .markdown-content pre code {
        background: transparent;
        padding: 0;
        color: inherit;
      }
      .markdown-content img {
        max-width: 100%;
        height: auto;
        margin: 20px 0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .markdown-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .markdown-content th, .markdown-content td {
        border: 1px solid #e0e0e0;
        padding: 12px 15px;
        text-align: left;
      }
      .markdown-content th {
        background: linear-gradient(135deg, #145F39, #005746);
        color: white;
        font-weight: bold;
      }
      .markdown-content tr:nth-child(even) {
        background: #f9f9f9;
      }
      .markdown-content a {
        color: #145F39;
        text-decoration: none;
        border-bottom: 1px dashed #145F39;
        transition: all 0.3s;
      }
      .markdown-content a:hover {
        color: #005746;
        border-bottom-style: solid;
      }
      .markdown-content hr {
        border: none;
        height: 2px;
        background: linear-gradient(to right, transparent, #CDEDDE, transparent);
        margin: 30px 0;
      }
      .markdown-content strong {
        color: #005746;
        font-weight: bold;
      }
      .markdown-content em {
        color: #008F8D;
        font-style: italic;
      }
    `;
    container.appendChild(style);

    // 使用html2canvas生成图片
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // 创建PDF
    const imgWidth = 210; // A4宽度（mm）
    const pageHeight = 297; // A4高度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 添加第一页
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 如果内容超过一页，添加更多页
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 保存PDF
    const fileName = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.pdf`;
    pdf.save(fileName);

    // 清理临时容器
    document.body.removeChild(container);

    return Promise.resolve();
  } catch (error) {
    console.error('PDF导出失败:', error);
    return Promise.reject(error);
  }
}

/**
 * 简化版PDF导出（不使用html2canvas，直接使用jsPDF）
 * @param title 博客标题
 * @param content Markdown内容
 * @param author 作者名称
 * @param date 发布日期
 * @param city 城市
 */
export async function exportBlogToPDFSimple(
  title: string,
  content: string,
  author?: string,
  date?: string,
  city?: string
): Promise<void> {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    // 设置字体
    pdf.setFont('helvetica');

    // 添加标题
    pdf.setFontSize(24);
    pdf.setTextColor(20, 95, 57); // 松绿色
    pdf.text(title, margin, y);
    y += 15;

    // 添加元信息
    pdf.setFontSize(12);
    pdf.setTextColor(102, 102, 102);
    let metaInfo = '';
    if (author) metaInfo += `作者: ${author}  `;
    if (date) metaInfo += `日期: ${date}  `;
    if (city) metaInfo += `城市: ${city}`;
    if (metaInfo) {
      pdf.text(metaInfo, margin, y);
      y += 10;
    }

    // 添加分隔线
    pdf.setDrawColor(20, 95, 57);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    // 将Markdown转换为纯文本（简单处理）
    const plainText = content
      .replace(/#{1,6}\s/g, '') // 移除标题标记
      .replace(/\*\*/g, '') // 移除粗体标记
      .replace(/\*/g, '') // 移除斜体标记
      .replace(/`{3}[\s\S]*?`{3}/g, '') // 移除代码块
      .replace(/`/g, '') // 移除行内代码标记
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 将链接转换为纯文本
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片]') // 将图片标记替换为[图片]
      .replace(/^\s*[-*+]\s/gm, '• ') // 将列表标记替换为项目符号
      .replace(/^\s*\d+\.\s/gm, '• ') // 将有序列表标记替换为项目符号
      .replace(/>\s/g, '  ') // 移除引用标记
      .trim();

    // 添加内容
    pdf.setFontSize(12);
    pdf.setTextColor(51, 51, 51);

    const lines = pdf.splitTextToSize(plainText, pageWidth - 2 * margin);
    const lineHeight = 7;

    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }

    // 添加页脚
    const footerY = pageHeight - 10;
    pdf.setFontSize(10);
    pdf.setTextColor(153, 153, 153);
    pdf.text(`由 LiveTrip 生成 | ${new Date().toLocaleDateString('zh-CN')}`, margin, footerY);

    // 保存PDF
    const fileName = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.pdf`;
    pdf.save(fileName);

    return Promise.resolve();
  } catch (error) {
    console.error('PDF导出失败:', error);
    return Promise.reject(error);
  }
}
