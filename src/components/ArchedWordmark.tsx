import {useEffect, useRef} from 'react';

/** Solid English wordmark: flat cap line and a gently raised center baseline. */
export default function ArchedWordmark({text, color = '#e50914'}: { text: string; color?: string }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const source = document.createElement('canvas');
        const paint = source.getContext('2d')!;
        paint.font = '900 100px Arial, sans-serif';
        const metrics = paint.measureText(text);
        source.width = Math.ceil(metrics.width) + 8;
        source.height = 140;
        paint.font = '900 100px Arial, sans-serif';
        paint.fillStyle = color;
        paint.fillText(text, 4, 110);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pixels = source.getContext('2d')!.getImageData(0, 0, source.width, source.height).data;
        let left = source.width, right = 0, top = source.height, bottom = 0;
        for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) if (pixels[(y * source.width + x) * 4 + 3] > 20) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
        if (right < left) return;
        const w = right - left + 1, h = bottom - top + 1;
        canvas.width = w;
        canvas.height = h;
        canvas.style.aspectRatio = `${w} / ${h}`;
        for (let x = 0; x < w; x++) {
            const curve = text.trim().length > 1 ? .14 * Math.sin(Math.PI * x / Math.max(1, w - 1)) : 0;
            ctx.drawImage(source, left + x, top, 1, h, x, 0, 1, h * (1 - curve));
        }
        // The website wordmark uses ordinary solid typography, independent of intro geometry.
    }, [text, color]);
    return <canvas ref={ref} className="jc-wordmark" role="img" aria-label={text}/>;
}
