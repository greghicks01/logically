import React, { useState } from 'react';
import './GateConfigDialog.css';

export interface GateConfigDialogProps {
  isOpen: boolean;
  onConfirm: (config: { numInputs: number; name?: string }) => void;
  onCancel: () => void;
}

export const GateConfigDialog: React.FC<GateConfigDialogProps> = ({ isOpen, onConfirm, onCancel }) => {
  const [numInputs, setNumInputs] = useState(2);
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      numInputs,
      name: name.trim() || undefined,
    });
    // Reset for next time
    setNumInputs(2);
    setName('');
  };

  const handleCancel = () => {
    onCancel();
    // Reset for next time
    setNumInputs(2);
    setName('');
  };

  return (
    <div className="gate-config-overlay" onClick={handleCancel}>
      <div className="gate-config-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Configure AND Gate</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="numInputs">
              Number of Inputs (2-8):
              <input
                type="number"
                id="numInputs"
                min="2"
                max="8"
                value={numInputs}
                onChange={(e) => setNumInputs(parseInt(e.target.value) || 2)}
                required
              />
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="name">
              Name (optional):
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Logic"
                maxLength={20}
              />
            </label>
          </div>

          <div className="dialog-buttons">
            <button type="submit" className="btn-primary">
              Create Gate
            </button>
            <button type="button" onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
