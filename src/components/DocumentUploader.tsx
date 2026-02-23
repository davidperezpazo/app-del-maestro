import { useState, useRef, type DragEvent } from 'react';

interface DocumentUploaderProps {
    label: string;
    description: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    icon: string;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
// Valid MIME types mapping roughly to those extensions
const ACCEPTED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];

export function DocumentUploader({ label, description, file, onFileChange, icon }: DocumentUploaderProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    function isValidFile(file: File): boolean {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_MIME_TYPES.includes(file.type);
    }

    function handleFile(newFile: File | undefined) {
        setError(null);
        if (!newFile) return;

        if (isValidFile(newFile)) {
            onFileChange(newFile);
        } else {
            setError('Formato no válido. Usa PDF, DOCX o TXT.');
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        setIsDragOver(true);
    }

    function handleDragLeave() {
        setIsDragOver(false);
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFile(droppedFile);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        handleFile(selected);
    }

    function handleRemove() {
        onFileChange(null);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Icon based on extension
    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return '📄';
        if (ext === 'docx') return '📝';
        if (ext === 'txt') return '📃';
        return '📁';
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-sacramento-700 flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                {label}
            </label>

            {!file ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`upload-zone rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragOver ? 'drag-over scale-[1.02]' : 'hover:border-gold-500'
                        } ${error ? 'border-red-400 bg-red-50/50' : ''}`}
                >
                    <div className="text-4xl mb-3 opacity-60">📁</div>
                    <p className="text-sacramento-600 font-medium text-sm">{description}</p>
                    <p className="text-sacramento-400 text-xs mt-2">
                        Arrastra aquí o haz clic para seleccionar
                    </p>
                    <p className="text-sacramento-300 text-xs mt-1 font-mono">PDF, DOCX o TXT · Máx. 100MB</p>
                    {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                </div>
            ) : (
                <div className="glass-card rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sacramento-100 flex items-center justify-center text-2xl shrink-0">
                        {getFileIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sacramento-800 truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-sacramento-400">{formatSize(file.size)}</p>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="p-2 rounded-lg text-sacramento-400 hover:text-error hover:bg-red-50 transition-colors"
                        title="Eliminar archivo"
                    >
                        ✕
                    </button>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    );
}
