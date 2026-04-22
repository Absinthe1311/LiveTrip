// 应用主组件 - 配置路由
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Itinerary from './pages/Itinerary';
import TripDetail from './pages/TripDetail';
import MyTrips from './pages/MyTrips';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import DestinationDetail from './pages/DestinationDetail';
import Favorites from './pages/Favorites';
import Destinations from './pages/Destinations';
import SharedTrip from './pages/SharedTripNew';
import Blogs from './pages/Blogs';
import BlogCreate from './pages/BlogCreate';
import BlogDetail from './pages/BlogDetail';
import AIFeatures from './pages/AIFeatures';
import Today from './pages/Today';
import AuthGuard from './components/auth/AuthGuard';
import AdminGuard from './components/admin/AdminGuard';
import SpotManagePage from './pages/admin/SpotManagePage';
import ReviewPage from './pages/admin/ReviewPage';
// 协同规划页面
import CollabEntry from './pages/CollabEntry';
import CollabSetup from './pages/collab/CollabSetup';
import JoinCollabRoom from './pages/collab/JoinCollabRoom';
import CollabRoom from './pages/collab/CollabRoom';

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
              <Plan />
            </AuthGuard>
          }
        />
        <Route
          path="/itinerary"
          element={
            <AuthGuard>
              <Itinerary />
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
              <MyTrips />
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
              <Favorites />
            </AuthGuard>
          }
        />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/shared/:token" element={<SharedTrip />} />
        <Route
          path="/blogs"
          element={
            <AuthGuard>
              <Blogs />
            </AuthGuard>
          }
        />
        <Route
          path="/blog/create"
          element={
            <AuthGuard>
              <BlogCreate />
            </AuthGuard>
          }
        />
        <Route
          path="/blog/edit"
          element={
            <AuthGuard>
              <BlogCreate />
            </AuthGuard>
          }
        />
        <Route
          path="/blog/:id"
          element={
            <AuthGuard>
              <BlogDetail />
            </AuthGuard>
          }
        />
        {/* AI 功能页面 */}
        <Route
          path="/ai-features"
          element={
            <AuthGuard>
              <AIFeatures />
            </AuthGuard>
          }
        />
        {/* 当前行程页面 */}
        <Route
          path="/today"
          element={
            <AuthGuard>
              <Today />
            </AuthGuard>
          }
        />
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
              <CollabEntry />
            </AuthGuard>
          }
        />
        <Route
          path="/collab/setup"
          element={
            <AuthGuard>
              <CollabSetup />
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
