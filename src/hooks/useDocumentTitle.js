import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | Mercatora` : 'Mercatora | Shop, dine and unwind under one roof';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
