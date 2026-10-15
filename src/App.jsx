import { lazy, Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { BagProvider } from './context/BagContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import RequireRole from './components/layout/RequireRole.jsx';
import { PageLoader } from './components/ui/Feedback.jsx';
import Home from './pages/public/Home.jsx';
import Stores from './pages/public/Stores.jsx';
import ShopDetail from './pages/public/ShopDetail.jsx';
import AuthPage from './pages/public/AuthPage.jsx';
import NotFound from './pages/public/NotFound.jsx';

// Secondary pages and the whole console load on demand to keep the first paint light.
const MapPage = lazy(() => import('./pages/public/MapPage.jsx'));
const WhatsOn = lazy(() => import('./pages/public/WhatsOn.jsx'));
const Visit = lazy(() => import('./pages/public/Visit.jsx'));
const Favorites = lazy(() => import('./pages/public/Favorites.jsx'));
const Reservations = lazy(() => import('./pages/public/Reservations.jsx'));
const Account = lazy(() => import('./pages/public/Account.jsx'));

const ConsoleLayout = lazy(() => import('./components/console/ConsoleLayout.jsx'));
const Dashboard = lazy(() => import('./pages/console/Dashboard.jsx'));
const ConsoleStores = lazy(() => import('./pages/console/Stores.jsx'));
const ConsoleProducts = lazy(() => import('./pages/console/Products.jsx'));
const ConsoleReservations = lazy(() => import('./pages/console/Reservations.jsx'));
const ConsoleOffers = lazy(() => import('./pages/console/Offers.jsx'));
const ConsoleReviews = lazy(() => import('./pages/console/Reviews.jsx'));
const ConsoleUsers = lazy(() => import('./pages/console/Users.jsx'));
const ConsoleAudit = lazy(() => import('./pages/console/Audit.jsx'));
const ConsoleSettings = lazy(() => import('./pages/console/Settings.jsx'));

const lazyEl = (el) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;
const adminOnly = (el) => <RequireRole roles={['admin']}>{lazyEl(el)}</RequireRole>;

const router = createBrowserRouter(
  [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/stores', element: <Stores /> },
      { path: '/stores/:id', element: <ShopDetail /> },
      { path: '/map', element: lazyEl(<MapPage />) },
      { path: '/whats-on', element: lazyEl(<WhatsOn />) },
      { path: '/visit', element: lazyEl(<Visit />) },
      { path: '/favorites', element: lazyEl(<Favorites />) },
      { path: '/reservations', element: lazyEl(<Reservations />) },
      { path: '/account', element: lazyEl(<Account />) },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/register', element: <AuthPage mode="register" /> },
  { path: '/forgot', element: <AuthPage mode="reset" /> },
  {
    path: '/console',
    element: (
      <RequireRole roles={['admin', 'owner']}>
        {lazyEl(<ConsoleLayout />)}
      </RequireRole>
    ),
    children: [
      { index: true, element: lazyEl(<Dashboard />) },
      { path: 'stores', element: lazyEl(<ConsoleStores />) },
      { path: 'products', element: lazyEl(<ConsoleProducts />) },
      { path: 'reservations', element: lazyEl(<ConsoleReservations />) },
      { path: 'offers', element: lazyEl(<ConsoleOffers />) },
      { path: 'reviews', element: lazyEl(<ConsoleReviews />) },
      { path: 'users', element: adminOnly(<ConsoleUsers />) },
      { path: 'audit', element: adminOnly(<ConsoleAudit />) },
      { path: 'settings', element: adminOnly(<ConsoleSettings />) },
    ],
  },
  ],
  { future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true } },
);

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <SettingsProvider>
              <FavoritesProvider>
                <BagProvider>
                  <RouterProvider router={router} future={{ v7_startTransition: true }} />
                </BagProvider>
              </FavoritesProvider>
            </SettingsProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
