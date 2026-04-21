/**
 * Export Utility for Excel (CSV Format)
 * Standardizes high-fidelity data export across the Dravanua Admin suite.
 */

export const exportToExcel = (data, filename, columns) => {
  if (!data || !data.length) return;

  // Use specified columns or derive from first object
  const headerKeys = columns || Object.keys(data[0]);
  
  // Format CSV Content
  const csvRows = [];
  
  // 1. Add Header Row
  csvRows.push(headerKeys.join(','));

  // 2. Add Data Rows
  data.forEach(row => {
    const values = headerKeys.map(key => {
      let val = row[key];
      
      // Handle null/undefined
      if (val === null || val === undefined) return '""';
      
      // Sanitize value for CSV (escape quotes, remove newlines)
      const sanitized = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
      
      // Wrap in quotes if it contains comma or spaces
      return sanitized.includes(',') || sanitized.includes(' ') ? `"${sanitized}"` : sanitized;
    });
    csvRows.push(values.join(','));
  });

  // Create Blob with UTF-8 BOM for Excel compatibility
  const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Trigger Download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
