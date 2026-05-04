/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 搜索栏组件 - 搜索热门目的地、行程和Blog
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, FileText, X } from 'lucide-react';

interface SearchResult {
  type: 'destination' | 'trip' | 'blog';
  id: string;
  title: string;
  subtitle: string;
  image?: string;
}

interface HotDestination {
  city: string;
  spotCount: number;
  coverImage?: string;
  description?: string;
}

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  hotDestinations: HotDestination[];
  searchResults: SearchResult[];
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, hotDestinations, searchResults }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim()) {
        onSearch(keyword);
        setShowDropdown(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, onSearch]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理结果点击
  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'destination':
        navigate(`/destinations/${result.id}`);
        break;
      case 'trip':
        navigate(`/trips/${result.id}`);
        break;
      case 'blog':
        navigate(`/blogs/${result.id}`);
        break;
    }
    setShowDropdown(false);
    setKeyword('');
  };

  // 获取图标
  const getIcon = (type: string) => {
    switch (type) {
      case 'destination':
        return <MapPin className="w-4 h-4 text-amber-400" />;
      case 'trip':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'blog':
        return <FileText className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder="搜索热门目的地、我的行程或游记..."
          className="w-full pl-12 pr-10 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none transition-all duration-300"
        />
        {keyword && (
          <button
            onClick={() => {
              setKeyword('');
              setShowDropdown(false);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl max-h-96 overflow-y-auto z-[9999]">
          {/* 空搜索显示热门推荐 */}
          {!keyword.trim() && hotDestinations.length > 0 && (
            <>
              <div className="px-4 py-2 text-white/60 text-sm border-b border-white/10">
                热门目的地
              </div>
              {hotDestinations.map((dest) => (
                <div
                  key={dest.city}
                  onClick={() =>
                    handleResultClick({
                      type: 'destination',
                      id: dest.city,
                      title: dest.city,
                      subtitle: `${dest.spotCount}个热门景点`,
                      image: dest.coverImage,
                    })
                  }
                  className="flex items-center gap-3 p-4 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{dest.city}</div>
                    <div className="text-white/60 text-sm truncate">
                      {dest.description || `${dest.spotCount}个热门景点`}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 搜索结果 */}
          {keyword.trim() && searchResults.length > 0 && (
            <>
              <div className="px-4 py-2 text-white/60 text-sm border-b border-white/10">
                搜索结果 ({searchResults.length})
              </div>
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="flex items-center gap-3 p-4 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      {getIcon(result.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{result.title}</div>
                    <div className="text-white/60 text-sm truncate">{result.subtitle}</div>
                  </div>
                  <div className="flex-shrink-0">{getIcon(result.type)}</div>
                </div>
              ))}
            </>
          )}

          {/* 无结果 */}
          {keyword.trim() && searchResults.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">未找到相关结果</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
