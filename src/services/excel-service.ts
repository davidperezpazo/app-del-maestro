import ExcelJS from 'exceljs';
import type { Planning } from '../types/planning';

/**
 * Genera un archivo Excel con la planificación inyectada en la plantilla maestra.
 */
export async function generateExcel(planning: Planning): Promise<Blob> {
    // Cargar la plantilla maestra
    const response = await fetch('/plantilla_maestra.xlsx');
    const templateBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('No se encontró la hoja en la plantilla');

    // Renombrar la hoja con el título de la SA
    const shortTitle = planning.metadata.tituloSA.substring(0, 31); // Excel limit
    worksheet.name = shortTitle;

    // === Fila 1: Metadatos ===
    setCellValue(worksheet, 'B1', planning.metadata.curso);
    setCellValue(worksheet, 'E1', planning.metadata.nivel);
    setCellValue(worksheet, 'F1', planning.metadata.etapa);
    setCellValue(worksheet, 'L1', planning.metadata.grupo);

    // === Fila 3: Título SA ===
    setCellValue(worksheet, 'B3', planning.metadata.tituloSA);

    // === Fila 4: Justificación ===
    setCellValue(worksheet, 'B4', planning.metadata.justificacion);

    // === Filas 8+: Datos de la planificación ===
    const startRow = 8;
    const rows = planning.rows;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = startRow + i;

        // Asegurar que la fila existe
        const wsRow = worksheet.getRow(rowNum);

        // Columna A: Competencias Clave (generalmente se ponen en la primera fila y se hace merge)
        if (i === 0 || row.competenciasClave !== rows[i - 1]?.competenciasClave) {
            setCellValue(worksheet, `A${rowNum}`, row.competenciasClave);
        }

        // Columna B: CE Misma Área
        if (i === 0 || row.ceMismaArea !== rows[i - 1]?.ceMismaArea) {
            setCellValue(worksheet, `B${rowNum}`, row.ceMismaArea);
        }

        // Columna C: CE Relacionada con otra área
        if (i === 0 || row.ceRelacionada !== rows[i - 1]?.ceRelacionada) {
            setCellValue(worksheet, `C${rowNum}`, row.ceRelacionada);
        }

        // Columna D: Saberes Básicos
        if (i === 0 || row.sabereBasicos !== rows[i - 1]?.sabereBasicos) {
            setCellValue(worksheet, `D${rowNum}`, row.sabereBasicos);
        }

        // Columna E: Saber Específico
        if (i === 0 || row.saberEspecifico !== rows[i - 1]?.saberEspecifico) {
            setCellValue(worksheet, `E${rowNum}`, row.saberEspecifico);
        }

        // Columna F: Criterios de Evaluación SA
        if (i === 0 || row.criteriosEvalSA !== rows[i - 1]?.criteriosEvalSA) {
            setCellValue(worksheet, `F${rowNum}`, row.criteriosEvalSA);
        }

        // Columna G: Indicadores de Logro
        setCellValue(worksheet, `G${rowNum}`, row.indicadoresLogro);

        // Columna H: (Indicadores logro detallados - en algunos ejemplos)
        // Columna I: Porcentaje
        setCellValue(worksheet, `I${rowNum}`, row.porcentaje);

        // Columna J: Instrumentos de Evaluación
        setCellValue(worksheet, `J${rowNum}`, row.instrumentosEval);

        // Columna K: Temporalización
        setCellValue(worksheet, `K${rowNum}`, row.temporizacion);

        // Columna L: Actividades
        setCellValue(worksheet, `L${rowNum}`, row.actividades);

        // Columna M: Recursos
        setCellValue(worksheet, `M${rowNum}`, row.recursos);

        // Columna N: Espacio
        setCellValue(worksheet, `N${rowNum}`, row.espacio);

        // Aplicar estilos a cada celda de la fila
        applyRowStyles(wsRow);
    }

    // === Columnas O-S: DUA (merged) ===
    if (planning.dua) {
        setCellValue(worksheet, `O${startRow}`, planning.dua);
    }

    // Generar el buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
}

function setCellValue(
    worksheet: ExcelJS.Worksheet,
    cellRef: string,
    value: string | number
): void {
    const cell = worksheet.getCell(cellRef);
    cell.value = value;
}

function applyRowStyles(row: ExcelJS.Row): void {
    row.eachCell({ includeEmpty: false }, (cell) => {
        cell.alignment = {
            wrapText: true,
            vertical: 'top',
        };
        cell.font = {
            name: 'Calibri',
            size: 9,
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });
}

/**
 * Descarga un Blob como archivo.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
