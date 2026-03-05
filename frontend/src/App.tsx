// 应用主组件 - 配置路由
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Itinerary from './pages/Itinerary';
import MyTrips from './pages/MyTrips';
import Auth from './pages/Auth';
import DestinationDetail from './pages/DestinationDetail';
import Favorites from './pages/Favorites';
import Destinations from './pages/Destinations';

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
      </Routes>
    </Router>
  );
}

export default App;
