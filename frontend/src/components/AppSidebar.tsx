"use client";

import { useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Plus,
  Sparkles,
  Globe,
  Heart,
  PenLine,
  List,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  icon: React.ElementType;
  label: string;
  badge?: string;
  badgeVariant?: "new" | "count" | "today";
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "主菜单",
    items: [
      { icon: Home, label: "首页", href: "/" },
      { icon: Plus, label: "创建行程", href: "/plan" },
      { icon: Sparkles, label: "AI 功能", badge: "新", badgeVariant: "new", href: "#ai-features" },
      { icon: Globe, label: "热门目的地", href: "/destinations" },
      { icon: Heart, label: "我的收藏", badge: "12", badgeVariant: "count", href: "/favorites" },
    ],
  },
  {
    title: "社区",
    items: [{ icon: PenLine, label: "旅行博客", href: "/blogs" }],
  },
  {
    title: "我的旅行",
    items: [
      { icon: List, label: "我的行程", badge: "4", badgeVariant: "count", href: "/my-trips" },
      { icon: MapPin, label: "当前行程", badge: "今", badgeVariant: "today", href: "#today" },
    ],
  },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      // TODO: 实现新功能页面
      console.log('新功能页面待实现:', href);
    } else {
      navigate(href);
    }
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const getBadgeVariant = (variant?: string) => {
    switch (variant) {
      case "new":
        return "default";
      case "count":
        return "secondary";
      case "today":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case "new":
        return "bg-livetrip-primary text-white text-[10px] px-1.5 py-0";
      case "count":
        return "bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0";
      case "today":
        return "bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0";
      default:
        return "bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0";
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 w-[220px] bg-white border-r border-border z-40 flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          !isOpen && "-translate-x-full"
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item, itemIndex) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-livetrip-primary-light text-livetrip-primary-dark border-l-2 border-livetrip-primary"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant={getBadgeVariant(item.badgeVariant)} className={getBadgeStyle(item.badgeVariant)}>
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border">
          <div 
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => {
              // TODO: 实现用户详情页
              console.log('用户详情页待实现');
            }}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-livetrip-primary to-emerald-400 text-white text-xs font-medium">
                {user?.username?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username || '游客'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                旅行达人 · Lv.4
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </aside>
    </>
  );
}
