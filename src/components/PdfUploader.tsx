import { useState, useRef, type DragEvent } from 'react';

interface PdfUploaderProps {
    label: string;
    description: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    icon: string;
}

export function PdfUploader({ label, description, file, onFileChange, icon }: PdfUploaderProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
        if (droppedFile && droppedFile.type === 'application/pdf') {
            onFileChange(droppedFile);
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (selected) {
            onFileChange(selected);
        }
    }

    function handleRemove() {
        onFileChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

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
                        }`}
                >
                    <div className="text-4xl mb-3 opacity-60">📄</div>
                    <p className="text-sacramento-600 font-medium text-sm">{description}</p>
                    <p className="text-sacramento-400 text-xs mt-2">
                        Arrastra aquí o haz clic para seleccionar
                    </p>
                    <p className="text-sacramento-300 text-xs mt-1">PDF · Máximo 100MB</p>
                </div>
            ) : (
                <div className="glass-card rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sacramento-100 flex items-center justify-center text-2xl shrink-0">
                        📄
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sacramento-800 truncate">{file.name}</p>
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
                accept=".pdf"
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    );
}
