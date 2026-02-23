import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

export interface PdfExtractionProgress {
    currentPage: number;
    totalPages: number;
    percentage: number;
}

/**
 * Extrae todo el texto de un archivo PDF.
 * Soporta PDFs grandes (100+ páginas).
 */
export async function extractTextFromPdf(
    file: File,
    onProgress?: (progress: PdfExtractionProgress) => void
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
 * Extrae texto de un PDF y lo trunca si excede el límite.
 * Útil para no exceder el contexto de la IA.
 */
export async function extractTextWithLimit(
    file: File,
    maxChars: number = 500000,
    onProgress?: (progress: PdfExtractionProgress) => void
): Promise<string> {
    const fullText = await extractTextFromPdf(file, onProgress);
    if (fullText.length <= maxChars) return fullText;
    return fullText.substring(0, maxChars) + '\n\n[...texto truncado por límite de contexto...]';
}
