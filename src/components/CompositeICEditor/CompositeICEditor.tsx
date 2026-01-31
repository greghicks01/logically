import { useState } from 'react';
import { CompositeIC } from '../../models/CompositeIC';
import { ICPin } from '../../models/ICPin';
import { CompositeICManager } from '../../services/CompositeICManager';

export interface CompositeICEditorProps {
  manager: CompositeICManager;
  onSave: (ic: CompositeIC) => void;
  onCancel: () => void;
}

/**
 * Composite IC Editor component
 * Allows users to create and edit composite ICs
 */
export function CompositeICEditor({ manager, onSave, onCancel }: CompositeICEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inputPins, setInputPins] = useState<Array<{ label: string; wireId: string }>>([
    { label: '', wireId: '' },
  ]);
  const [outputPins, setOutputPins] = useState<Array<{ label: string; wireId: string }>>([
    { label: '', wireId: '' },
  ]);

  const handleAddInputPin = () => {
    setInputPins([...inputPins, { label: '', wireId: '' }]);
  };

  const handleAddOutputPin = () => {
    setOutputPins([...outputPins, { label: '', wireId: '' }]);
  };

  const handleRemoveInputPin = (index: number) => {
    setInputPins(inputPins.filter((_, i) => i !== index));
  };

  const handleRemoveOutputPin = (index: number) => {
    setOutputPins(outputPins.filter((_, i) => i !== index));
  };

  const handleInputPinChange = (index: number, field: 'label' | 'wireId', value: string) => {
    const newPins = [...inputPins];
    newPins[index][field] = value;
    setInputPins(newPins);
  };

  const handleOutputPinChange = (index: number, field: 'label' | 'wireId', value: string) => {
    const newPins = [...outputPins];
    newPins[index][field] = value;
    setOutputPins(newPins);
  };

  const handleSave = () => {
    // TODO: Implement actual IC creation from current circuit
    // This is a placeholder implementation
    console.log('Saving IC:', { name, description, inputPins, outputPins });
    onSave({} as CompositeIC); // Placeholder
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2>Create Composite IC</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            placeholder="e.g., SR_LATCH"
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Description:
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            placeholder="Optional description"
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Input Pins</h3>
        {inputPins.map((pin, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={pin.label}
              onChange={(e) => handleInputPinChange(index, 'label', e.target.value)}
              placeholder="Label (e.g., S, R, Q̅)"
              style={{ padding: '5px', marginRight: '10px' }}
            />
            <input
              type="text"
              value={pin.wireId}
              onChange={(e) => handleInputPinChange(index, 'wireId', e.target.value)}
              placeholder="Internal Wire ID"
              style={{ padding: '5px', marginRight: '10px' }}
            />
            <button onClick={() => handleRemoveInputPin(index)}>Remove</button>
          </div>
        ))}
        <button onClick={handleAddInputPin}>Add Input Pin</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Output Pins</h3>
        {outputPins.map((pin, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={pin.label}
              onChange={(e) => handleOutputPinChange(index, 'label', e.target.value)}
              placeholder="Label (e.g., Q, Q̅)"
              style={{ padding: '5px', marginRight: '10px' }}
            />
            <input
              type="text"
              value={pin.wireId}
              onChange={(e) => handleOutputPinChange(index, 'wireId', e.target.value)}
              placeholder="Internal Wire ID"
              style={{ padding: '5px', marginRight: '10px' }}
            />
            <button onClick={() => handleRemoveOutputPin(index)}>Remove</button>
          </div>
        ))}
        <button onClick={handleAddOutputPin}>Add Output Pin</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleSave} style={{ marginRight: '10px', padding: '10px 20px' }}>
          Save IC
        </button>
        <button onClick={onCancel} style={{ padding: '10px 20px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
