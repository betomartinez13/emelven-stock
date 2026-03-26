import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { TDocumentDefinitions, StyleDictionary, Content } from 'pdfmake/interfaces';
import { Material } from '../materials/entities/material.entity';
import { MonthlyConsumptionResponse } from '../reports/dto/report-responses.dto';
import { ProjectConsumptionResponse } from '../reports/dto/report-responses.dto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vfsFonts = require('pdfmake/build/vfs_fonts');

// Register fonts into pdfmake's virtual filesystem
for (const [filename, data] of Object.entries(vfsFonts)) {
  pdfmake.virtualfs.writeFileSync(filename, Buffer.from(data as string, 'base64'));
}

pdfmake.addFonts({
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
});

const HEADER_COLOR = '#1a3a5c';
const ALT_ROW_COLOR = '#f0f4f8';
const TODAY = () => new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

@Injectable()
export class PdfService {
  private buildHeader(title: string, generatedBy: string): Content[] {
    return [
      { text: 'EMELVEN C.A.', style: 'companyName' },
      { text: 'Sistema de Control de Inventario', style: 'companySubtitle' },
      { text: title, style: 'reportTitle' },
      { text: `Generado por: ${generatedBy} | Fecha: ${TODAY()}`, style: 'metaLine' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: HEADER_COLOR }], margin: [0, 4, 0, 12] },
    ];
  }

  private getStyles(): StyleDictionary {
    return {
      companyName: { fontSize: 18, bold: true, color: HEADER_COLOR, alignment: 'center', margin: [0, 0, 0, 2] },
      companySubtitle: { fontSize: 10, color: '#555', alignment: 'center', margin: [0, 0, 0, 4] },
      reportTitle: { fontSize: 13, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
      metaLine: { fontSize: 8, color: '#777', alignment: 'center', margin: [0, 0, 0, 4] },
      tableHeader: { bold: true, color: 'white', fillColor: HEADER_COLOR, fontSize: 9 },
      tableRow: { fontSize: 9 },
      tableRowAlt: { fontSize: 9, fillColor: ALT_ROW_COLOR },
      sectionTitle: { fontSize: 11, bold: true, color: HEADER_COLOR, margin: [0, 8, 0, 4] },
      infoLabel: { bold: true, fontSize: 9 },
      infoValue: { fontSize: 9 },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateBuffer(docDefinition: any): Promise<Buffer> {
    const doc = pdfmake.createPdf(docDefinition);
    return doc.getBuffer();
  }

  async generateMonthlyReport(data: MonthlyConsumptionResponse, generatedBy: string): Promise<Buffer> {
    const monthLabels = data.labels;

    // Table header row
    const headerRow = [
      { text: 'Material', style: 'tableHeader' },
      { text: 'Unidad', style: 'tableHeader' },
      ...monthLabels.map((m) => ({ text: m, style: 'tableHeader', alignment: 'center' })),
      { text: 'Total', style: 'tableHeader', alignment: 'center' },
    ];

    // Data rows
    const dataRows = data.items.map((item, idx) => {
      const rowStyle = idx % 2 === 0 ? 'tableRow' : 'tableRowAlt';
      const monthly = item.consumoPorMes.map((m) => ({
        text: m.cantidad > 0 ? String(m.cantidad) : '-',
        style: rowStyle,
        alignment: 'center' as const,
      }));
      const total = item.consumoPorMes.reduce((s, m) => s + m.cantidad, 0);
      return [
        { text: item.nombre, style: rowStyle },
        { text: item.unidad, style: rowStyle },
        ...monthly,
        { text: String(total), style: rowStyle, bold: true, alignment: 'center' as const },
      ];
    });

    const colWidths = ['*', 'auto', ...monthLabels.map(() => 'auto' as const), 'auto'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
      pageOrientation: 'landscape',
      pageMargins: [30, 30, 30, 40],
      content: [
        ...this.buildHeader(`Consumo Mensual de Materiales — ${data.year}`, generatedBy),
        data.items.length === 0
          ? { text: 'No hay datos de consumo para este año.', italics: true, color: '#999', margin: [0, 20, 0, 0] }
          : {
              table: {
                headerRows: 1,
                widths: colWidths,
                body: [headerRow, ...dataRows],
              },
              layout: 'lightHorizontalLines',
            },
      ],
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        color: '#999',
        margin: [0, 0, 30, 0],
      }),
      styles: this.getStyles(),
      defaultStyle: { font: 'Roboto' },
    };

    return this.generateBuffer(docDefinition);
  }

  async generateProjectReport(data: ProjectConsumptionResponse, generatedBy: string): Promise<Buffer> {
    const wo = data.workOrder;

    const infoSection: Content = {
      table: {
        widths: ['auto', '*', 'auto', '*'],
        body: [
          [
            { text: 'Orden de Trabajo:', style: 'infoLabel' },
            { text: wo.codigo, style: 'infoValue' },
            { text: 'Cliente:', style: 'infoLabel' },
            { text: wo.cliente, style: 'infoValue' },
          ],
          [
            { text: 'Descripción:', style: 'infoLabel' },
            { text: wo.descripcion, style: 'infoValue', colSpan: 3 },
            {}, {},
          ],
          [
            { text: 'Estado:', style: 'infoLabel' },
            { text: wo.estado, style: 'infoValue' },
            { text: 'Fecha Inicio:', style: 'infoLabel' },
            { text: wo.fechaInicio, style: 'infoValue' },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 12] as [number, number, number, number],
    };

    const headerRow = [
      { text: 'Material', style: 'tableHeader' },
      { text: 'Unidad', style: 'tableHeader' },
      { text: 'Cantidad Usada', style: 'tableHeader', alignment: 'right' },
      { text: '% del Total', style: 'tableHeader', alignment: 'right' },
    ];

    const dataRows = data.materials.map((m, idx) => {
      const rowStyle = idx % 2 === 0 ? 'tableRow' : 'tableRowAlt';
      return [
        { text: m.nombre, style: rowStyle },
        { text: m.unidad, style: rowStyle },
        { text: String(m.cantidadUsada), style: rowStyle, alignment: 'right' as const },
        { text: `${m.porcentaje}%`, style: rowStyle, alignment: 'right' as const },
      ];
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
      pageMargins: [40, 30, 40, 40],
      content: [
        ...this.buildHeader(`Consumo de Materiales por Proyecto`, generatedBy),
        infoSection,
        { text: 'Detalle de Materiales Consumidos', style: 'sectionTitle' },
        data.materials.length === 0
          ? { text: 'No hay materiales registrados para esta orden.', italics: true, color: '#999' }
          : {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto'],
                body: [headerRow, ...dataRows],
              },
              layout: 'lightHorizontalLines',
            },
      ],
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        color: '#999',
        margin: [0, 0, 40, 0],
      }),
      styles: this.getStyles(),
      defaultStyle: { font: 'Roboto' },
    };

    return this.generateBuffer(docDefinition);
  }

  async generateInventoryStatusReport(materials: Material[], generatedBy: string): Promise<Buffer> {
    const statusLabel: Record<string, string> = {
      critical: 'SIN STOCK',
      low: 'Stock bajo',
      normal: 'Normal',
      high: 'Alto',
    };
    const statusColor: Record<string, string> = {
      critical: '#c0392b',
      low: '#e67e22',
      normal: '#27ae60',
      high: '#2980b9',
    };

    const headerRow = [
      { text: 'Material', style: 'tableHeader' },
      { text: 'Categoría', style: 'tableHeader' },
      { text: 'Proveedor', style: 'tableHeader' },
      { text: 'Unidad', style: 'tableHeader' },
      { text: 'Stock Actual', style: 'tableHeader', alignment: 'right' },
      { text: 'Stock Mín', style: 'tableHeader', alignment: 'right' },
      { text: 'Stock Máx', style: 'tableHeader', alignment: 'right' },
      { text: 'Estado', style: 'tableHeader', alignment: 'center' },
    ];

    const dataRows = materials.map((m, idx) => {
      const rowStyle = idx % 2 === 0 ? 'tableRow' : 'tableRowAlt';
      const status = m.stockStatus;
      return [
        { text: m.nombre, style: rowStyle },
        { text: m.category?.nombre ?? '-', style: rowStyle },
        { text: m.supplier?.nombre ?? '-', style: rowStyle },
        { text: m.unidad, style: rowStyle },
        { text: String(m.stockActual), style: rowStyle, alignment: 'right' as const },
        { text: String(m.stockMin), style: rowStyle, alignment: 'right' as const },
        { text: String(m.stockMax), style: rowStyle, alignment: 'right' as const },
        {
          text: statusLabel[status] ?? status,
          style: rowStyle,
          alignment: 'center' as const,
          color: statusColor[status] ?? '#333',
          bold: status === 'critical' || status === 'low',
        },
      ];
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
      pageOrientation: 'landscape',
      pageMargins: [30, 30, 30, 40],
      content: [
        ...this.buildHeader('Estado Actual del Inventario', generatedBy),
        materials.length === 0
          ? { text: 'No hay materiales registrados.', italics: true, color: '#999' }
          : {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [headerRow, ...dataRows],
              },
              layout: 'lightHorizontalLines',
            },
      ],
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        color: '#999',
        margin: [0, 0, 30, 0],
      }),
      styles: this.getStyles(),
      defaultStyle: { font: 'Roboto' },
    };

    return this.generateBuffer(docDefinition);
  }
}
