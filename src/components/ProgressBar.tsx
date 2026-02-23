interface ProgressBarProps {
    progress: number;
    message: string;
    status: string;
}

export function ProgressBar({ progress, message, status }: ProgressBarProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'extracting-pdf': return 'bg-sacramento-500';
            case 'calling-ai': return 'bg-gold-500';
            case 'generating-excel': return 'bg-success';
            case 'done': return 'bg-success';
            case 'error': return 'bg-error';
            default: return 'bg-sacramento-400';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'extracting-pdf': return '📄';
            case 'calling-ai': return '🤖';
            case 'generating-excel': return '📊';
            case 'done': return '✅';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    return (
        <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{getStatusIcon()}</span>
                <p className="text-sm font-medium text-sacramento-700">{message}</p>
            </div>
            <div className="w-full bg-sacramento-100 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${getStatusColor()} ${status === 'calling-ai' ? 'pulse-glow' : ''
                        }`}
                    style={{ width: `${Math.max(progress, 3)}%` }}
                />
            </div>
            <p className="text-xs text-sacramento-400 mt-2 text-right">{progress}%</p>
        </div>
    );
}
