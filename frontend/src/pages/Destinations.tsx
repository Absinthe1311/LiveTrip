// 热门目的地列表页
import PopularDestinations from '../components/PopularDestinations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Destinations() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        background: '#f5f7fa'
      }}>
        <PopularDestinations />
      </div>
      <Footer />
    </div>
  );
}
