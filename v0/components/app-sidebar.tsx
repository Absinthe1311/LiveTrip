"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
      { icon: Plus, label: "创建行程", href: "/create-trip" },
      { icon: Sparkles, label: "AI 功能", badge: "新", badgeVariant: "new", href: "/ai-features" },
      { icon: Globe, label: "热门目的地", href: "/destinations" },
      { icon: Heart, label: "我的收藏", badge: "12", badgeVariant: "count", href: "/favorites" },
    ],
  },
  {
    title: "社区",
    items: [{ icon: PenLine, label: "旅行博客", href: "/blog" }],
  },
  {
    title: "我的旅行",
    items: [
      { icon: List, label: "我的行程", badge: "4", badgeVariant: "count", href: "/my-trips" },
      { icon: MapPin, label: "当前行程", badge: "今", badgeVariant: "today", href: "/today" },
    ],
  },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname();

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
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <h3 className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => onClose?.()}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative",
                          isActive
                            ? "bg-secondary text-primary font-medium"
                            : "text-muted-foreground hover:bg-gray-50"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-4 font-medium",
                              item.badgeVariant === "new" &&
                                "bg-primary text-white",
                              item.badgeVariant === "count" &&
                                "bg-gray-200 text-gray-600",
                              item.badgeVariant === "today" &&
                                "bg-accent text-white"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer User Card */}
        <div className="p-3 border-t border-border">
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-white text-sm font-medium">
                ZL
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">
                Zhang Lei
              </p>
              <p className="text-[11px] text-muted-foreground">
                旅行达人 · Lv.4
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </aside>
    </>
  );
}
