"use client";

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportColumn {
  key: string;
  label: string;
}

export type ExportRow = Record<string, string | number | null | undefined>;

export interface ExportDataset {
  fileName: string;
  sheetName?: string;
  title?: string;
  columns: ExportColumn[];
  rows: ExportRow[];
}

function toCsv(dataset: ExportDataset): string {
  const header = dataset.columns.map((col) => col.label);
  const rows = dataset.rows.map((row) =>
    dataset.columns.map((col) => {
      const value = row[col.key];
      const str = value === null || value === undefined ? '' : String(value);
      // Escape quotes and wrap in quotes when the value contains special chars
      return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    })
  );
  return [header, ...rows].map((line) => line.join(',')).join('\n');
}

function downloadBlob(content: BlobPart, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(dataset: ExportDataset) {
  downloadBlob(toCsv(dataset), `${dataset.fileName}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadXlsx(dataset: ExportDataset) {
  const header = dataset.columns.map((col) => col.label);
  const body = dataset.rows.map((row) => dataset.columns.map((col) => row[col.key] ?? ''));

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  worksheet['!cols'] = header.map((label) => ({ wch: Math.max(label.length, 12) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, dataset.sheetName || 'Report');
  XLSX.writeFile(workbook, `${dataset.fileName}.xlsx`);
}

export function downloadPdf(dataset: ExportDataset) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  if (dataset.title) {
    doc.setFontSize(14);
    doc.text(dataset.title, 40, 40);
  }

  autoTable(doc, {
    head: [dataset.columns.map((col) => col.label)],
    body: dataset.rows.map((row) => dataset.columns.map((col) => row[col.key] ?? '')),
    startY: dataset.title ? 55 : 40,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [41, 41, 41] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${dataset.fileName}.pdf`);
}

export function exportDataset(dataset: ExportDataset, format: ExportFormat) {
  switch (format) {
    case 'csv':
      downloadCsv(dataset);
      break;
    case 'xlsx':
      downloadXlsx(dataset);
      break;
    case 'pdf':
      downloadPdf(dataset);
      break;
  }
}