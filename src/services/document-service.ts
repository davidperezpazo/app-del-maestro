import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

export interface DocExtractionProgress {
    currentPage: number;
    totalPages: number;
    percentage: number;
}

/**
 * Extrae todo el texto de un archivo PDF usando pdfjs-dist.
 */
async function extractTextFromPdf(
    file: File,
    onProgress?: (progress: DocExtractionProgress) => void
): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
        textParts.push(pageText);

        onProgress?.({
            currentPage: i,
            totalPages,
            percentage: Math.round((i / totalPages) * 100),
        });
    }

    return textParts.join('\n\n');
}

/**
 * Extrae todo el texto de un archivo DOCX usando mammoth.
 */
async function extractTextFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
}

/**
 * Extrae texto de un archivo soportado (PDF, DOCX, TXT) limitando a maxChars.
 * Simula progreso para TXT/DOCX de forma instantánea.
 */
export async function extractTextWithLimit(
    file: File,
    maxChars: number = 500000,
    onProgress?: (progress: DocExtractionProgress) => void
): Promise<string> {
    let fullText = '';
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Simulate start progress
    onProgress?.({ currentPage: 0, totalPages: 1, percentage: 0 });

    try {
        if (extension === 'pdf') {
            fullText = await extractTextFromPdf(file, onProgress);
        } else if (extension === 'docx') {
            fullText = await extractTextFromDocx(file);
            // Simulate end progress for docx
            onProgress?.({ currentPage: 1, totalPages: 1, percentage: 100 });
        } else if (extension === 'txt') {
            fullText = await file.text();
            // Simulate end progress for txt
            onProgress?.({ currentPage: 1, totalPages: 1, percentage: 100 });
        } else {
            throw new Error(`Formato de archivo no soportado: ${extension}`);
        }

        if (fullText.length <= maxChars) return fullText;
        return fullText.substring(0, maxChars) + '\n\n[...texto truncado por límite de contexto...]';
    } catch (error) {
        console.error("Error extracting text:", error);
        throw new Error(`Error al procesar el archivo ${file.name}. ¿Está corrupto o protegido?`);
    }
}
