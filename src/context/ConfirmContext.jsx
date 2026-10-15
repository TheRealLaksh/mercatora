import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';

const ConfirmContext = createContext(() => Promise.resolve(false));

/** const confirm = useConfirm(); if (await confirm({ title, body, confirmLabel, tone })) ... */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog(opts);
      }),
    [],
  );

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal open={Boolean(dialog)} onClose={() => close(false)} title={dialog?.title ?? ''} size="sm">
        {dialog && (
          <>
            {dialog.body && <p className="text-sm leading-relaxed text-ink-2">{dialog.body}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => close(false)}>
                {dialog.cancelLabel ?? 'Cancel'}
              </Button>
              <Button variant={dialog.tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
                {dialog.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
