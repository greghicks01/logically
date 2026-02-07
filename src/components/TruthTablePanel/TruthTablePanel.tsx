import React, { useRef, useEffect, useMemo } from 'react';
import { TruthTable, TruthTablePreferences, DEFAULT_TRUTH_TABLE_PREFERENCES } from '../../models/TruthTable';
import { LogicLevel } from '../../models/LogicLevel';
import { formatLogicLevel } from '../../lib/truthTableUtils';
import { Gate, updateCurrentState } from '../../services/TruthTableGenerator';
import './TruthTablePanel.css';

export interface TruthTablePanelProps {
  /** Truth table to display */
  truthTable: TruthTable;
  
  /** Current input values from circuit */
  currentInputs: Record<string, LogicLevel>;
  
  /** Callback when user clicks a row to set circuit state (optional) */
  onRowClick?: (inputs: Record<string, LogicLevel>) => void;
  
  /** Display preferences */
  preferences?: TruthTablePreferences;
}

/**
 * Displays a truth table for a gate with current state highlighting
 */
export const TruthTablePanel: React.FC<TruthTablePanelProps> = ({
  truthTable,
  currentInputs,
  onRowClick,
  preferences = DEFAULT_TRUTH_TABLE_PREFERENCES
}) => {
  const currentRowRef = useRef<HTMLTableRowElement | null>(null);
  
  // Update current state
  const updatedTable = useMemo(
    () => updateCurrentState(truthTable, currentInputs),
    [truthTable, currentInputs]
  );
  
  // Auto-scroll to current row
  useEffect(() => {
    if (preferences.autoScroll && currentRowRef.current) {
      currentRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentInputs, preferences.autoScroll]);
  
  if (!truthTable.isVisible) {
    return null;
  }
  
  const handleRowClick = (inputs: Record<string, LogicLevel>) => {
    if (onRowClick) {
      onRowClick(inputs);
    }
  };
  
  return (
    <div
      className="truth-table-panel"
      role="region"
      aria-label={`Truth table for gate ${truthTable.gateId}`}
    >
      <div className="truth-table-header">
        <h3>Truth Table</h3>
      </div>
      
      <div className="truth-table-container">
        <table className="truth-table">
          <thead>
            <tr>
              {preferences.showRowNumbers && <th scope="col">#</th>}
              {updatedTable.inputPins.map(pin => (
                <th key={pin} scope="col" className="input-column">
                  {pin}
                </th>
              ))}
              <th scope="col" className="output-column">
                {updatedTable.outputPin}
              </th>
            </tr>
          </thead>
          <tbody>
            {updatedTable.rows.map((row, index) => (
              <tr
                key={row.id}
                ref={row.isCurrent ? currentRowRef : null}
                className={`truth-table-row ${row.isCurrent ? 'current-row' : ''} ${onRowClick ? 'clickable' : ''}`}
                onClick={() => handleRowClick(row.inputs)}
                aria-current={row.isCurrent ? 'true' : undefined}
              >
                {preferences.showRowNumbers && (
                  <td className="row-number">{index}</td>
                )}
                {updatedTable.inputPins.map(pin => (
                  <td key={pin} className="input-cell">
                    {formatLogicLevel(row.inputs[pin], preferences.displayFormat)}
                  </td>
                ))}
                <td className="output-cell">
                  {formatLogicLevel(row.output, preferences.displayFormat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
