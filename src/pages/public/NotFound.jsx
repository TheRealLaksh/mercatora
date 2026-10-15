import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="display text-[9rem] leading-none text-brass-fill">404</p>
        <h1 className="display mt-2 text-5xl text-ink">This corridor leads nowhere</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-2">The page you wanted does not exist or has moved. Let's get you back to the shops.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button as={Link} to="/">Go home</Button>
          <Button as={Link} to="/stores" variant="outline">Browse stores</Button>
        </div>
      </div>
    </div>
  );
}
