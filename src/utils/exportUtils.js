/**
 * exportUtils — DRAVANUA HUB
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared utilities for:
 *   • Excel (.xlsx) export
 *   • Email report delivery (via backend API)
 *   • Currency formatting with locale support
 */

import * as XLSX from 'xlsx';

// ─── CURRENCY HELPERS ────────────────────────────────────────────────────────

export const CURRENCIES = [
  { code: 'RWF', label: 'RWF — Rwandan Franc',   locale: 'rw-RW', symbol: 'RWF' },
  { code: 'USD', label: 'USD — US Dollar',        locale: 'en-US', symbol: '$'   },
  { code: 'EUR', label: 'EUR — Euro',             locale: 'de-DE', symbol: '€'   },
  { code: 'GBP', label: 'GBP — British Pound',   locale: 'en-GB', symbol: '£'   },
  { code: 'KES', label: 'KES — Kenyan Shilling',  locale: 'sw-KE', symbol: 'KSh' },
  { code: 'UGX', label: 'UGX — Ugandan Shilling', locale: 'sw-UG', symbol: 'USh' },
  { code: 'TZS', label: 'TZS — Tanzanian Shilling',locale:'sw-TZ',symbol: 'TSh' },
];

/**
 * Format a numeric amount as a currency string.
 * @param {number} amount
 * @param {string} currencyCode   — e.g. "RWF"
 * @returns {string}
 */
export function formatCurrency(amount, currencyCode = 'RWF') {
  const entry = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  try {
    return new Intl.NumberFormat(entry.locale, {
      style:    'currency',
      currency: entry.code,
      maximumFractionDigits: entry.code === 'RWF' ? 0 : 2,
    }).format(amount || 0);
  } catch {
    return `${entry.symbol} ${(amount || 0).toLocaleString()}`;
  }
}

/**
 * Shorthand: format with a simple "CODE 1,234" style (no locale quirks).
 */
export function fmtAmt(amount, currencyCode = 'RWF') {
  const entry = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const num   = Number(amount) || 0;
  return `${entry.symbol} ${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}


// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────

/**
 * Export one or more sheets to an .xlsx file and trigger browser download.
 *
 * @param {Array<{ name: string, rows: Array<Object> }>} sheets
 *   Each element is one sheet. `rows` is an array of plain objects — the keys
 *   become column headers.
 * @param {string} filename  — e.g. "Analytics_Report_2025"
 */
export function exportToExcel(sheets, filename = 'DraVanua_Export') {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, rows }) => {
    if (!rows || rows.length === 0) {
      // Empty placeholder sheet
      const ws = XLSX.utils.aoa_to_sheet([['No data available for this section.']]);
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(name));
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const cols = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
    }));
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(name));
  });

  const ts   = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
}

function sanitizeSheetName(name = 'Sheet') {
  // Excel sheet names: max 31 chars, no special chars
  return name.replace(/[:\\/?*\[\]]/g, '-').slice(0, 31);
}


// ─── EMAIL REPORT ────────────────────────────────────────────────────────────

/**
 * Send a report to one or more email addresses via the backend.
 *
 * @param {Object} params
 * @param {string}   params.to          — recipient email (comma-separated for multiple)
 * @param {string}   params.subject     — email subject line
 * @param {string}   params.htmlBody    — full HTML email body (same as print report)
 * @param {string}   [params.moduleCode]— e.g. "ANA" | "FIN" | "ATT"
 * @param {Function} [params.secureFetch]— AuthContext.secureFetch instance
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendReportEmail({ to, subject, htmlBody, moduleCode = 'DVS', secureFetch }) {
  try {
    const url = import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/reports/email';
    const body = JSON.stringify({ to, subject, htmlBody, moduleCode });
    const options = {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    };

    let res;
    if (secureFetch) {
      res = await secureFetch(url, options);
    } else {
      const token = localStorage.getItem('adminToken');
      options.headers.Authorization = `Bearer ${token}`;
      res = await fetch(url, options);
    }

    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || (res.ok ? 'Report sent successfully.' : 'Failed to send report.'),
    };
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}
