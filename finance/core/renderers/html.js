// HTML renderer for Report

export function renderHTML(report){
  const esc = (s) => String(s).replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const parts = [];
  parts.push('<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; color:#0f172a">');
  parts.push(`<h3 style="margin:0 0 8px">${esc(report.title||'Report')}</h3>`);
  for (const sec of (report.sections||[])){
    if (sec.kind === 'text'){
      parts.push(`<p style="margin:8px 0">${esc(sec.data.text||'')}</p>`);
    } else if (sec.kind === 'list'){
      parts.push(`<div style="margin:8px 0"><b>${esc(sec.title||'')}</b><ul style="margin:6px 0 0 18px">`);
      for (const it of (sec.data.items||[])) parts.push(`<li>${esc(it)}</li>`);
      parts.push('</ul></div>');
    } else if (sec.kind === 'table'){
      parts.push(`<div style="margin:8px 0"><b>${esc(sec.title||'')}</b>`);
      parts.push('<table style="border-collapse:collapse; margin-top:6px">');
      parts.push('<thead><tr>');
      for (const c of (sec.data.columns||[])) parts.push(`<th style="border:1px solid #e2e8f0; padding:4px 8px; text-align:left; background:#f8fafc">${esc(c)}</th>`);
      parts.push('</tr></thead><tbody>');
      for (const r of (sec.data.rows||[])){
        parts.push('<tr>');
        for (const cell of r) parts.push(`<td style="border:1px solid #e2e8f0; padding:4px 8px">${esc(cell)}</td>`);
        parts.push('</tr>');
      }
      parts.push('</tbody></table></div>');
    } else if (sec.kind === 'figure'){
      // Leave figure rendering to the client (chat can use its chart block)
      parts.push(`<div style="margin:8px 0"><b>${esc(sec.title||'Figure')}</b><div style="font-size:12px;color:#64748b">(Figure omitted in HTML renderer)</div></div>`);
    }
  }
  parts.push('</div>');
  return parts.join('');
}

