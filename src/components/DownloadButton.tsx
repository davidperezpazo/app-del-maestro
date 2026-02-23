interface DownloadButtonProps {
    fileName: string;
    blob: Blob;
    unitName: string;
}

export function DownloadButton({ fileName, blob, unitName }: DownloadButtonProps) {
    function handleDownload() {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <button
            onClick={handleDownload}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-sacramento-700 to-sacramento-600 text-white hover:from-sacramento-600 hover:to-sacramento-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
        >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl shrink-0">
                📥
            </div>
            <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{unitName}</p>
                <p className="text-xs text-sacramento-200">{fileName}</p>
            </div>
            <span className="text-gold-400 font-bold text-sm">Descargar</span>
        </button>
    );
}
