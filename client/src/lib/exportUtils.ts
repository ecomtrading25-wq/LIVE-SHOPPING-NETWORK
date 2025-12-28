/**
 * Export Utilities for Dashboard Data
 * Supports CSV and PDF export with charts
 */

export interface ExportOptions {
  filename: string;
  format: 'csv' | 'pdf';
  data: any[];
  columns?: ExportColumn[];
  title?: string;
  subtitle?: string;
  includeTimestamp?: boolean;
}

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename, data, columns } = options;

  if (!data || data.length === 0) {
    console.warn('[Export] No data to export');
    return;
  }

  // Determine columns
  const exportColumns = columns || Object.keys(data[0]).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
  }));

  // Create CSV header
  const header = exportColumns.map(col => escapeCSV(col.label)).join(',');

  // Create CSV rows
  const rows = data.map(row => {
    return exportColumns.map(col => {
      const value = row[col.key];
      const formatted = col.formatter ? col.formatter(value) : value;
      return escapeCSV(String(formatted ?? ''));
    }).join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to PDF format
 * Note: This is a simplified version. For production, consider using jsPDF or similar library
 */
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { filename, title, subtitle, data, columns } = options;

  // For now, we'll create a simple HTML representation and print it
  // In production, you'd want to use a proper PDF library like jsPDF
  
  const exportColumns = columns || Object.keys(data[0] || {}).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
  }));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title || filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
        h2 {
          font-size: 14px;
          margin-bottom: 20px;
          color: #666;
          font-weight: normal;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${title ? `<h1>${title}</h1>` : ''}
      ${subtitle ? `<h2>${subtitle}</h2>` : ''}
      <table>
        <thead>
          <tr>
            ${exportColumns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${exportColumns.map(col => {
                const value = row[col.key];
                const formatted = col.formatter ? col.formatter(value) : value;
                return `<td>${formatted ?? ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } else {
    console.error('[Export] Failed to open print window');
  }
}

/**
 * Export chart data with visualization
 * Captures the chart as an image and includes it in the export
 */
export async function exportChartToPDF(
  chartElement: HTMLElement,
  options: ExportOptions
): Promise<void> {
  // This would require html2canvas or similar library
  // For now, we'll just export the data
  console.warn('[Export] Chart export requires html2canvas library');
  await exportToPDF(options);
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Format currency for export
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format percentage for export
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Format date for export
 */
export function formatDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format datetime for export
 */
export function formatDateTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Batch export multiple datasets
 */
export async function batchExport(exports: ExportOptions[]): Promise<void> {
  for (const exportOptions of exports) {
    if (exportOptions.format === 'csv') {
      exportToCSV(exportOptions);
    } else {
      await exportToPDF(exportOptions);
    }
    
    // Add small delay between exports
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Export dashboard summary
 */
export interface DashboardSummary {
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    trend?: string;
  }>;
  data: any[];
  columns: ExportColumn[];
}

export function exportDashboardSummary(
  summary: DashboardSummary,
  format: 'csv' | 'pdf' = 'csv'
): void {
  const filename = `${summary.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  
  if (format === 'csv') {
    // Export metrics as CSV
    const metricsData = summary.metrics.map(m => ({
      metric: m.label,
      value: m.value,
      trend: m.trend || 'N/A'
    }));

    exportToCSV({
      filename: `${filename}_metrics`,
      format: 'csv',
      data: metricsData
    });

    // Export main data as CSV
    if (summary.data.length > 0) {
      exportToCSV({
        filename: `${filename}_data`,
        format: 'csv',
        data: summary.data,
        columns: summary.columns
      });
    }
  } else {
    // Export as PDF with both metrics and data
    const combinedData = [
      ...summary.metrics.map(m => ({
        type: 'Metric',
        name: m.label,
        value: m.value,
        details: m.trend || ''
      })),
      ...summary.data.map((row, index) => ({
        type: 'Data',
        ...row
      }))
    ];

    exportToPDF({
      filename,
      format: 'pdf',
      title: summary.title,
      subtitle: `Generated on ${new Date().toLocaleString()}`,
      data: combinedData,
      columns: [
        { key: 'type', label: 'Type' },
        ...summary.columns
      ]
    });
  }
}
