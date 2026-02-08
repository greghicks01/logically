import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TruthTablePanel } from '../../src/components/TruthTablePanel/TruthTablePanel';
import { TruthTable } from '../../src/models/TruthTable';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('TruthTablePanel', () => {
  const mockTruthTable2Input: TruthTable = {
    gateId: 'and-1',
    inputPins: ['A', 'B'],
    outputPin: 'Y',
    rows: [
      {
        id: '00',
        inputs: { A: LogicLevel.LOW, B: LogicLevel.LOW },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '01',
        inputs: { A: LogicLevel.LOW, B: LogicLevel.HIGH },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '10',
        inputs: { A: LogicLevel.HIGH, B: LogicLevel.LOW },
        output: LogicLevel.LOW,
        isCurrent: true // Current row
      },
      {
        id: '11',
        inputs: { A: LogicLevel.HIGH, B: LogicLevel.HIGH },
        output: LogicLevel.HIGH,
        isCurrent: false
      }
    ],
    isVisible: true,
    generatedAt: Date.now()
  };

  const mockTruthTable3Input: TruthTable = {
    gateId: 'and-2',
    inputPins: ['A', 'B', 'C'],
    outputPin: 'Y',
    rows: [
      {
        id: '000',
        inputs: { A: LogicLevel.LOW, B: LogicLevel.LOW, C: LogicLevel.LOW },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '001',
        inputs: { A: LogicLevel.LOW, B: LogicLevel.LOW, C: LogicLevel.HIGH },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '010',
        inputs: { A: LogicLevel.LOW, B: LogicLevel.HIGH, C: LogicLevel.LOW },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '011',
        inputs: { A: LogicLevel.LOW, B: LogicLevel.HIGH, C: LogicLevel.HIGH },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '100',
        inputs: { A: LogicLevel.HIGH, B: LogicLevel.LOW, C: LogicLevel.LOW },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '101',
        inputs: { A: LogicLevel.HIGH, B: LogicLevel.LOW, C: LogicLevel.HIGH },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '110',
        inputs: { A: LogicLevel.HIGH, B: LogicLevel.HIGH, C: LogicLevel.LOW },
        output: LogicLevel.LOW,
        isCurrent: false
      },
      {
        id: '111',
        inputs: { A: LogicLevel.HIGH, B: LogicLevel.HIGH, C: LogicLevel.HIGH },
        output: LogicLevel.HIGH,
        isCurrent: true
      }
    ],
    isVisible: true,
    generatedAt: Date.now()
  };

  describe('rendering', () => {
    it('renders truth table header with input and output columns', () => {
      render(<TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('Y')).toBeInTheDocument();
    });

    it('renders all truth table rows', () => {
      render(<TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />);

      // Should have 4 data rows for 2-input gate
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(5); // 1 header + 4 data rows
    });

    it('displays logic levels correctly', () => {
      render(<TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />);

      // Check first row (00 -> 0)
      expect(screen.getAllByText('LOW')[0]).toBeInTheDocument();
      
      // Check last row (11 -> 1)
      expect(screen.getAllByText('HIGH').length).toBeGreaterThan(0);
    });

    it('renders 3-input truth table with 8 rows', () => {
      render(<TruthTablePanel table={mockTruthTable3Input} position={{ x: 100, y: 100 }} />);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(9); // 1 header + 8 data rows
    });

    it('positions panel at specified coordinates', () => {
      const { container } = render(
        <TruthTablePanel table={mockTruthTable2Input} position={{ x: 250, y: 150 }} />
      );

      const panel = container.firstChild as HTMLElement;
      expect(panel.style.left).toBe('250px');
      expect(panel.style.top).toBe('150px');
    });
  });

  describe('current row highlighting', () => {
    it('highlights the current row', () => {
      const { container } = render(
        <TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />
      );

      // Find the current row (id='10')
      const currentRow = container.querySelector('[data-row-id="10"]');
      expect(currentRow).toHaveClass('current-row');
    });

    it('does not highlight non-current rows', () => {
      const { container } = render(
        <TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />
      );

      const nonCurrentRow = container.querySelector('[data-row-id="00"]');
      expect(nonCurrentRow).not.toHaveClass('current-row');
    });

    it('handles no current row gracefully', () => {
      const tableWithNoCurrent = {
        ...mockTruthTable2Input,
        rows: mockTruthTable2Input.rows.map(r => ({ ...r, isCurrent: false }))
      };

      const { container } = render(
        <TruthTablePanel table={tableWithNoCurrent} position={{ x: 100, y: 100 }} />
      );

      const currentRows = container.querySelectorAll('.current-row');
      expect(currentRows).toHaveLength(0);
    });
  });

  describe('close functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(
        <TruthTablePanel 
          table={mockTruthTable2Input} 
          position={{ x: 100, y: 100 }}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.click();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders without close button if onClose not provided', () => {
      render(<TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />);

      const closeButton = screen.queryByRole('button', { name: /close/i });
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper table structure with headers', () => {
      render(<TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(3); // A, B, Y
    });

    it('has aria-label for the panel', () => {
      const { container } = render(
        <TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />
      );

      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveAttribute('aria-label');
    });

    it('marks current row with aria-current', () => {
      const { container } = render(
        <TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />
      );

      const currentRow = container.querySelector('[data-row-id="10"]');
      expect(currentRow).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('polymorphic behavior', () => {
    it('adapts to different input counts automatically', () => {
      const { rerender } = render(
        <TruthTablePanel table={mockTruthTable2Input} position={{ x: 100, y: 100 }} />
      );

      // 2 inputs + 1 output = 3 columns
      expect(screen.getAllByRole('columnheader')).toHaveLength(3);

      // Switch to 3-input table
      rerender(<TruthTablePanel table={mockTruthTable3Input} position={{ x: 100, y: 100 }} />);

      // 3 inputs + 1 output = 4 columns
      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    });

    it('renders any number of input columns without hardcoding', () => {
      // The component should work for N inputs without special cases
      render(<TruthTablePanel table={mockTruthTable3Input} position={{ x: 100, y: 100 }} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Y')).toBeInTheDocument();
    });
  });
});
