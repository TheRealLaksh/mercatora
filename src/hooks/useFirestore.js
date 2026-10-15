import { useEffect, useMemo, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

/**
 * Live query hook.
 * `factory` returns a Firestore Query (or null to stay idle). `deps` decide when it is rebuilt.
 * Returns { data, loading, error }. Data items are { id, ...fields }.
 */
export function useCollection(factory, deps = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const q = useMemo(factory, deps);
  const [state, setState] = useState({ data: [], loading: Boolean(q), error: null });

  useEffect(() => {
    if (!q) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: null }),
      (error) => {
        console.error('Query failed:', error);
        setState({ data: [], loading: false, error });
      },
    );
  }, [q]);

  return state;
}

/** Live single document. `factory` returns a DocumentReference or null. */
export function useDocument(factory, deps = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ref = useMemo(factory, deps);
  const [state, setState] = useState({ data: null, loading: Boolean(ref), error: null });

  useEffect(() => {
    if (!ref) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.exists() ? { id: snap.id, ...snap.data() } : null, loading: false, error: null }),
      (error) => {
        console.error('Document failed:', error);
        setState({ data: null, loading: false, error });
      },
    );
  }, [ref]);

  return state;
}
