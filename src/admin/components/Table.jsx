import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

const Table = ({ columns, data, onEdit, onDelete, onView }) => {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="admin-table-empty">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                <td>
                  <div className="admin-table-actions">
                    {onView && (
                      <button
                        className="admin-action-btn view"
                        onClick={() => onView(row)}
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className="admin-action-btn edit"
                        onClick={() => onEdit(row)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="admin-action-btn delete"
                        onClick={() => onDelete(row)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
