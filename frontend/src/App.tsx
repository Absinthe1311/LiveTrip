// 应用主组件 - 配置路由
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Itinerary from './pages/Itinerary';
import MyTrips from './pages/MyTrips';
import Auth from './pages/Auth';
import DestinationDetail from './pages/DestinationDetail';
import Favorites from './pages/Favorites';
import Destinations from './pages/Destinations';
import SharedTrip from './pages/SharedTrip';
import Blogs from './pages/Blogs';
import CreateBlog from './pages/CreateBlog';
import AdminGuard from './components/admin/AdminGuard';
import AdminLayout from './components/admin/AdminLayout';
import SpotManagePage from './pages/admin/SpotManagePage';
import ReviewPage from './pages/admin/ReviewPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/my-trips" element={<MyTrips />} />
        <Route path="/destination/:id" element={<DestinationDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/shared/:token" element={<SharedTrip />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/create" element={<CreateBlog />} />
        {/* 管理员路由 */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<Navigate to="/admin/spots" replace />} />
          <Route path="spots" element={<SpotManagePage />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
