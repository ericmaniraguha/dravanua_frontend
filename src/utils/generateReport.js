import JsBarcode from 'jsbarcode';

/**
 * generateReport — DRAVANUA HUB
 * Shared premium print report generator.
 * @param {Object} config
 * @param {string} config.title         — e.g. "Financial Audit Report"
 * @param {string} config.moduleCode    — e.g. "FIN" | "CRM" | "ATT"
 * @param {string} config.bodyHtml      — Inner HTML string for the report body
 * @param {string} [config.page2Html]   — Optional second page HTML
 */
export function generateReport({
  title,
  moduleCode = "DVS",
  bodyHtml,
  page2Html,
}) {
  // Admin user from localStorage
  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminUser")) || {};
    } catch {
      return {};
    }
  })();
  const generatedBy = adminUser.name || adminUser.username || "System";
  const generatedRole = adminUser.role || "Administrator";
  const generatedEmail = adminUser.email || "—";

  // Report metadata
  const reportId = `${moduleCode}-${Date.now().toString().slice(-6)}`;
  const reportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const reportYear = new Date().getFullYear();

  // Offline Scannable Barcode Generation (No Internet Required)
  const canvas = document.createElement("canvas");
  try {
    JsBarcode(canvas, reportId.toUpperCase(), {
      format: "CODE128",
      width: 2,
      height: 48,
      displayValue: false,
      lineColor: "#1B5E20",
      background: "#ffffff",
      margin: 0
    });
  } catch (e) {
    console.error("Barcode generation failed", e);
  }
  const barcodeDataUrl = canvas.toDataURL("image/png");
  const barcodeSvg = `<img src="${barcodeDataUrl}" alt="Scannable Barcode" style="width: 140px; height: 35px; object-fit: contain;" />`;

  const SHARED_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #fff; color: #1a1a2e; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 36px 44px; max-width: 900px; margin: 0 auto; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 80px; font-weight: 900; color: rgba(27,94,32,0.04); pointer-events: none; white-space: nowrap; z-index: 0; }
    .header-band { background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #43A047 100%); color: white; padding: 28px 36px; border-radius: 16px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .brand-name { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
    .brand-sub  { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .report-meta { text-align: right; display: flex; flex-direction: column; gap: 5px; }
    .meta-row { font-size: 11px; opacity: 0.85; }
    .meta-row strong { opacity: 1; font-weight: 700; }
    .report-badge { display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; }
    .gen-strip { background: #f0f7f0; border: 1px solid #c8e6c9; border-left: 4px solid #1B5E20; padding: 12px 20px; border-radius: 0 10px 10px 0; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; font-size: 11px; color: #444; }
    .gen-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #1B5E20, #43A047); color: white; font-weight: 900; font-size: 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .gen-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .gen-value { font-weight: 700; color: #1B5E20; font-size: 12px; }
    .section-title { font-size: 13px; font-weight: 800; color: #1B5E20; text-transform: uppercase; letter-spacing: 0.8px; margin: 22px 0 14px; padding-bottom: 6px; border-bottom: 2px solid #e8f5e9; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; display: inline-block; width: 4px; height: 16px; background: #1B5E20; border-radius: 2px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .metric-card { background: linear-gradient(135deg, #f8fdf8, #f0f7f0); border: 1px solid #c8e6c9; border-top: 3px solid #1B5E20; padding: 16px 12px; border-radius: 10px; text-align: center; }
    .metric-val { display: block; font-size: 22px; font-weight: 900; color: #1B5E20; }
    .metric-lbl { display: block; font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    thead tr { background: #1B5E20; color: white; }
    th { padding: 10px 12px; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    tbody tr:nth-child(even) { background: #fafff9; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .badge-green  { background: #e8f5e9; color: #2E7D32; }
    .badge-red    { background: #ffebee; color: #c62828; }
    .badge-blue   { background: #e3f2fd; color: #1565c0; }
    .badge-yellow { background: #fffde7; color: #f57f17; }
    .score-bar-wrap { background: #e8f5e9; border-radius: 4px; height: 8px; width: 100px; overflow: hidden; display:inline-block; vertical-align:middle; }
    .score-bar-fill { height: 100%; background: linear-gradient(90deg, #43A047, #1B5E20); border-radius: 4px; }
    .divider { border: none; border-top: 1px solid #e8f5e9; margin: 20px 0; }
    .page-break { page-break-before: always; padding-top: 36px; }
    .cert-box { background: #fffde7; border: 1px solid #fff176; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .cert-title { font-weight: 800; color: #795548; font-size: 12px; margin-bottom: 8px; }
    .cert-text  { color: #555; font-size: 11px; line-height: 1.6; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 28px; }
    .sig-box { text-align: center; }
    .sig-line { border-bottom: 1px solid #999; height: 44px; margin-bottom: 6px; }
    .sig-name { font-size: 10px; color: #555; font-weight: 600; }
    .sig-role { font-size: 9px; color: #999; }
    .barcode-section { text-align: center; margin: 28px 0 16px; }
    .barcode-id { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 3px; color: #666; margin-top: 6px; }
    .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #999; margin-top: 32px; }
    .footer-label { background: #ffebee; color: #c62828; padding: 3px 10px; border-radius: 10px; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
    .footer-page { font-weight: 700; color: #333; }
    @page { size: A4; margin: 10mm; }
  `;

  const miniHeader = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:14px; border-bottom:2px solid #e8f5e9; margin-bottom:22px; font-size:11px; color:#666;">
      <strong style="color:#1B5E20;">DRAVANUA HUB</strong> — ${title}
      <span>${reportId} &nbsp;|&nbsp; ${reportDate}</span>
    </div>`;

  const certAndSigs = `
    <hr class="divider"/>
    <div class="cert-box">
      <div class="cert-title">📋 Document Certification</div>
      <div class="cert-text">
        This report was automatically generated by the DRAVANUA HUB system on <strong>${reportDate}</strong> at <strong>${reportTime}</strong>.
        All data reflects live operational metrics and is intended solely for internal management review.
        Unauthorised reproduction or distribution is strictly prohibited.
      </div>
    </div>
    <div class="sig-grid">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-name">${generatedBy}</div><div class="sig-role">${generatedRole} — Report Author</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-name">Department Head</div><div class="sig-role">Review &amp; Approval</div></div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-name">System Administrator</div><div class="sig-role">Data Integrity Verification</div></div>
    </div>
    <div class="barcode-section" style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background: #fafafa; margin-top: 28px; text-align: left;">
      <div style="flex: 1;">
         <h4 style="color: #1B5E20; margin-bottom: 5px; font-size: 13px; font-weight: 900;">DRAVANUA HUB</h4>
         <p style="font-size: 10.5px; color: #555; line-height: 1.6; margin-bottom: 6px;">Studio, Classic Fashion, Flower Gifts, Stationery & Office Supplies.</p>
         <p style="font-size: 10px; color: #777;"><strong>Printed by:</strong> ${generatedBy} on ${reportDate}</p>
      </div>
      <div style="flex: 1; padding: 0 20px; border-left: 1px solid #ddd; margin: 0 20px;">
         <p style="font-size: 10.5px; color: #555; line-height: 1.8;">
           <strong>Contact:</strong> +250 788 000 000<br/>
           <strong>Email:</strong> info@dravanua.com<br/>
           <strong>Website:</strong> www.dravanua.com
         </p>
      </div>
      <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
         ${barcodeSvg}
         <div class="barcode-id" style="margin-top: 6px;">DVS-AUDIT-${reportYear}-${reportId}</div>
      </div>
    </div>`;

  const footerP1 = `<div class="footer"><span class="footer-label">Confidential</span><span class="footer-page">Page 1 of ${page2Html ? "2" : "1"}</span><span>${reportId} &nbsp;|&nbsp; Generated by ${generatedBy}</span></div>`;
  const footerP2 = `<div class="footer"><span class="footer-label">Confidential — Internal Use Only</span><span class="footer-page">Page 2 of 2 — END OF REPORT</span><span>${reportId} &nbsp;|&nbsp; Generated by ${generatedBy}</span></div>`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title} — ${reportId}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="watermark">CONFIDENTIAL</div>

  <!-- PAGE 1 -->
  <div class="page">
    <div class="header-band">
      <div>
        <div class="brand-name">DRAVANUA HUB</div>
        <div class="brand-sub">${title}</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">${reportId}</div>
        <div class="meta-row">Date: <strong>${reportDate}</strong></div>
        <div class="meta-row">Time: <strong>${reportTime}</strong></div>
        <div class="meta-row">Classification: <strong>CONFIDENTIAL</strong></div>
      </div>
    </div>

    <div class="gen-strip">
      <div class="gen-avatar">${generatedBy.charAt(0).toUpperCase()}</div>
      <div><div class="gen-label">Report Generated By</div><div class="gen-value">${generatedBy}</div></div>
      <div style="margin-left:24px;"><div class="gen-label">Role</div><div class="gen-value">${generatedRole}</div></div>
      <div style="margin-left:24px;"><div class="gen-label">Email</div><div class="gen-value">${generatedEmail}</div></div>
      <div style="margin-left:auto; text-align:right;"><div class="gen-label">Report ID</div><div class="gen-value">${reportId}</div></div>
    </div>

    ${bodyHtml}

    ${page2Html ? footerP1 : certAndSigs + footerP1}
  </div>

  ${
    page2Html
      ? `
  <!-- PAGE 2 -->
  <div class="page page-break">
    ${miniHeader}
    ${page2Html}
    ${certAndSigs}
    ${footerP2}
  </div>`
      : ""
  }
</body>
</html>`;

  const win = window.open("", "_blank", "width=960,height=900");
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}
