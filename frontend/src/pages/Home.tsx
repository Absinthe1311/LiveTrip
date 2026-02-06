// 首页 - LiveTrip 智能旅行规划
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CoreFeatures from '../components/CoreFeatures';
import QuickActions from '../components/QuickActions';
import PopularDestinations from '../components/PopularDestinations';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <HeroSection />
      <CoreFeatures />
      <QuickActions />
      <PopularDestinations />
      <Footer />
    </div>
  );
}
