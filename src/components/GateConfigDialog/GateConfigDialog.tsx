import React, { useState } from 'react';
import './GateConfigDialog.css';

export interface GateConfigDialogProps {
  isOpen: boolean;
  gateType?: string;
  initialNumInputs?: number;
  initialName?: string;
  isEditing?: boolean;
  onConfirm: (config: { numInputs: number; name?: string }) => void;
  onCancel: () => void;
}

export const GateConfigDialog: React.FC<GateConfigDialogProps> = ({ 
  isOpen, 
  gateType, 
  initialNumInputs = 2,
  initialName = '',
  isEditing = false,
  onConfirm, 
  onCancel 
}) => {
  const [numInputs, setNumInputs] = useState(initialNumInputs);
  const [name, setName] = useState(initialName);

  // Update state when initial values change (for editing mode)
  React.useEffect(() => {
    if (isOpen) {
      setNumInputs(initialNumInputs);
      setName(initialName);
    }
  }, [isOpen, initialNumInputs, initialName]);

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on dialog content
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="gate-config-overlay" onClick={handleOverlayClick}>
      <div className="gate-config-dialog">
        <h2>Configure {gateType ? gateType.toUpperCase() : 'Gate'}</h2>
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
              {isEditing ? 'Update Gate' : 'Create Gate'}
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
