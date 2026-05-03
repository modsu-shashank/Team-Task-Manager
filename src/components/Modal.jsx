import React from "react";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}