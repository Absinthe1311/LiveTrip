"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { HomeContent } from "@/components/home-content";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Sidebar */}
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="pt-14 lg:pl-[220px] min-h-screen">
        <div className="max-w-6xl mx-auto px-5 py-7 lg:px-7">
          <HomeContent />
        </div>
      </main>
    </div>
  );
}
