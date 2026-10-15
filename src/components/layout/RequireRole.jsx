import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageLoader } from '../ui/Feedback.jsx';
import Button from '../ui/Button.jsx';

/** Route guard. `roles` is the list of roles allowed in. */
export default function RequireRole({ roles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(role)) {
    return (
      <div className="container-x grid min-h-[70vh] place-items-center text-center">
        <div>
          <ShieldAlert className="mx-auto size-10 text-clay" aria-hidden="true" />
          <h1 className="display mt-4 text-5xl text-ink">Staff area</h1>
          <p className="mx-auto mt-3 max-w-md text-ink-2">Your account does not have access to the console. If you run a store here, ask the mall office to link your account.</p>
          <Button as={Link} to="/" className="mt-6">Back to the mall</Button>
        </div>
      </div>
    );
  }
  return children;
}
