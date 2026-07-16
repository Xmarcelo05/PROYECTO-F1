import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <>
      <Navbar />
      <div className="app-shell">
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}
