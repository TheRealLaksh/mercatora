import { Outlet, ScrollRestoration } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import BagDrawer from '../shop/BagDrawer.jsx';
import { ShopsProvider } from '../../context/ShopsContext.jsx';

export default function PublicLayout() {
  return (
    <ShopsProvider>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      <BagDrawer />
      <ScrollRestoration />
    </ShopsProvider>
  );
}
