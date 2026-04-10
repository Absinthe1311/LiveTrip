// 应用主组件 - 配置路由
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import Home from './pages/Home';
import PlanGlass from './pages/PlanGlass';
import ItineraryGlass from './pages/ItineraryGlass';
import ItineraryOptimized from './pages/ItineraryOptimized';
import TripDetail from './pages/TripDetail';
import MyTripsGlass from './pages/MyTripsGlass';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import DestinationDetail from './pages/DestinationDetail';
import FavoritesGlass from './pages/FavoritesGlass';
import DestinationsGlass from './pages/DestinationsGlass';
import SharedTrip from './pages/SharedTrip';
import BlogsGlass from './pages/BlogsGlass';
import CreateBlog from './pages/CreateBlog';
import BlogDetailPage from './pages/BlogDetailPage';
import AIFeaturesGlass from './pages/AIFeaturesGlass';
import TodayGlass from './pages/TodayGlass';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/admin/AdminGuard';
import SpotManagePage from './pages/admin/SpotManagePage';
import ReviewPage from './pages/admin/ReviewPage';
// 协同规划页面
import CollabEntryGlass from './pages/CollabEntryGlass';
import CreateCollabRoom from './pages/collab/CreateCollabRoom';
import JoinCollabRoom from './pages/collab/JoinCollabRoom';
import CollabRoom from './pages/collab/CollabRoom';
// 测试页面
import TestOptimizedCard from './pages/TestOptimizedCard';

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        {/* 普通用户路由 - 管理员无法访问 */}
        <Route
          path="/plan"
          element={
            <AuthGuard>
              <PlanGlass />
            </AuthGuard>
          }
        />
        <Route
          path="/itinerary"
          element={
            <AuthGuard>
              <ItineraryOptimized />
            </AuthGuard>
          }
        />
        {/* 行程详情页面 - 查看已保存的行程 */}
        <Route
          path="/trip/:id"
          element={
            <AuthGuard>
              <TripDetail />
            </AuthGuard>
          }
        />
        <Route
          path="/my-trips"
          element={
            <AuthGuard>
              <MyTripsGlass />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          }
        />
        <Route path="/destination/:id" element={<DestinationDetail />} />
        <Route
          path="/favorites"
          element={
            <AuthGuard>
              <FavoritesGlass />
            </AuthGuard>
          }
        />
        <Route path="/destinations" element={<DestinationsGlass />} />
        <Route path="/shared/:token" element={<SharedTrip />} />
        <Route
          path="/blogs"
          element={
            <AuthGuard>
              <BlogsGlass />
            </AuthGuard>
          }
        />
        <Route
          path="/blog/create"
          element={
            <AuthGuard>
              <CreateBlog />
            </AuthGuard>
          }
        />
        <Route
          path="/blog/:id"
          element={
            <AuthGuard>
              <BlogDetailPage />
            </AuthGuard>
          }
        />
        {/* AI 功能页面 */}
        <Route
          path="/ai-features"
          element={
            <AuthGuard>
              <AIFeaturesGlass />
            </AuthGuard>
          }
        />
        {/* 当前行程页面 */}
        <Route
          path="/today"
          element={
            <AuthGuard>
              <TodayGlass />
            </AuthGuard>
          }
        />
        {/* 测试优化卡片页面 */}
        <Route path="/test-card" element={<TestOptimizedCard />} />
        {/* 管理员路由 - 直接访问页面，不使用嵌套布局 */}
        <Route
          path="/admin/spots"
          element={
            <AdminGuard>
              <SpotManagePage />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/review"
          element={
            <AdminGuard>
              <ReviewPage />
            </AdminGuard>
          }
        />
        {/* 管理员默认路由 - 重定向到景点管理 */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/spots" replace />}
        />
        {/* 协同规划路由 */}
        <Route
          path="/collab"
          element={
            <AuthGuard>
              <CollabEntryGlass />
            </AuthGuard>
          }
        />
        <Route
          path="/collab/create/:tripId"
          element={
            <AuthGuard>
              <CreateCollabRoom />
            </AuthGuard>
          }
        />
        <Route
          path="/collab/join"
          element={
            <AuthGuard>
              <JoinCollabRoom />
            </AuthGuard>
          }
        />
        <Route
          path="/collab/room/:roomId"
          element={
            <AuthGuard>
              <CollabRoom />
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AntdApp>
      <AppContent />
    </AntdApp>
  );
}

export default App;
