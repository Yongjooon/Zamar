import React from 'react';

export default function Drawer({ open, onClose, children }) {
  return (
    <>
      <div className={`backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        {children}
      </aside>
    </>
  );
}
