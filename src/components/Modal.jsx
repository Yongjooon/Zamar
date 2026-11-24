import { useEffect, useId, useRef } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ title, className = '', dismissible = true, showCloseButton = true, onClose, children }) {
  const dialog = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} className={'dialog ' + className} aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => { if (dismissible && event.target === event.currentTarget) onClose(); }}>
      <div className="dialogLayout">
        <div className="dialogHead">
          <h2 id={titleId}>{title}</h2>
          {showCloseButton && <button className="iconBtn" type="button" aria-label="닫기" disabled={!dismissible} onClick={onClose}><Icon name="close" /></button>}
        </div>
        <div className="dialogBody">{children}</div>
      </div>
    </dialog>
  );
}
