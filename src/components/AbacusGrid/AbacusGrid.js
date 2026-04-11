import React from 'react';
import './AbacusGrid.css';

const AbacusGrid = ({ rows, onChange }) => {
    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        onChange(newRows);
    };

    const addRow = () => {
        if (rows.length < 15) {
            onChange([...rows, { op: '+', val: '' }]);
        }
    };

    const removeRow = (index) => {
        if (rows.length > 2) {
            const newRows = rows.filter((_, i) => i !== index);
            onChange(newRows);
        }
    };

    return (
        <div className="abacus-grid-container">
            <table className="abacus-grid-table">
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>Op</th>
                        <th>Number</th>
                        <th style={{ width: '50px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            <td>
                                <select 
                                    value={row.op} 
                                    onChange={(e) => handleRowChange(index, 'op', e.target.value)}
                                    className="abacus-op-select"
                                >
                                    <option value="+">+</option>
                                    <option value="-">-</option>
                                    <option value="x">x</option>
                                    <option value="/">/</option>
                                </select>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={row.val}
                                    onChange={(e) => handleRowChange(index, 'val', e.target.value)}
                                    placeholder="Value"
                                    className="abacus-val-input"
                                />
                            </td>
                            <td>
                                {rows.length > 2 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeRow(index)}
                                        className="abacus-remove-btn"
                                    >
                                        &times;
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="abacus-grid-actions">
                <button 
                    type="button" 
                    onClick={addRow} 
                    className="abacus-add-btn"
                    disabled={rows.length >= 15}
                >
                    + Add Row
                </button>
                <span className="row-count">{rows.length} / 15 rows</span>
            </div>
        </div>
    );
};

export default AbacusGrid;
