import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SlideProps } from '../SlideProps';
import './EndingCredits.css';

export interface Credit { role: string; name: string; section?: string }
export interface EndingCreditsData {
  movieTitle: string;
  endMessage: string;
  credits: string | Credit[];
  enableSound: boolean;
  mode?: 'text' | 'video';
  videoUrl?: string;
  speed?: number;
  subtitle?: string;
}

type Player = {
  playVideo(): void; pauseVideo(): void; seekTo(n: number, allowSeekAhead: boolean): void;
  mute(): void; unMute(): void; setVolume(v: number): void; destroy(): void;
};
type YouTubeAPI = { Player: new (element: HTMLElement, options: {
  videoId: string;
  width: string; height: string;
  host?: string;
  playerVars: Record<string, string | number>;
  events: { onReady(): void; onError(): void; onStateChange(e: { data: number }): void };
}) => Player };
let youtubePromise: Promise<YouTubeAPI> | undefined;
function loadYouTube(): Promise<YouTubeAPI> {
  const get = () => (window as Window & { YT?: YouTubeAPI }).YT;
  const existing = get();
  if (existing?.Player) return Promise.resolve(existing);
  if (youtubePromise) return youtubePromise;
  youtubePromise = new Promise<YouTubeAPI>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
    const start = Date.now();
    const timer = window.setInterval(() => {
      const api = get();
      if (api?.Player) { clearInterval(timer); resolve(api); }
      else if (Date.now() - start > 15000) {
        clearInterval(timer); reject(new Error('YouTube API unavailable'));
      }
    }, 100);
  }).catch((error: unknown) => { youtubePromise = undefined; throw error; });
  return youtubePromise;
}

export function parseCredits(value: EndingCreditsData['credits']): Credit[] {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); }
    catch {
      parsed = value.split('\n').filter(line => line.trim()).map(line => {
        const index = line.indexOf('|');
        return index < 0 ? { role: '', name: line.trim() }
          : { role: line.slice(0, index).trim(), name: line.slice(index + 1).trim() };
      });
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is Credit => !!item && typeof item === 'object'
    && typeof item.role === 'string' && typeof item.name === 'string'
    && (item.section === undefined || typeof item.section === 'string'));
}

const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i;

export function resolveVideo(raw: string): { kind: 'youtube' | 'image' | 'file' | 'invalid'; value: string } {
  if (!raw.trim()) return { kind: 'invalid', value: '' };
  try {
    const url = new URL(raw.trim(), window.location.href);
    if (!['http:', 'https:', 'blob:'].includes(url.protocol)) return { kind: 'invalid', value: '' };
    const host = url.hostname.toLowerCase();
    const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
    if (host === 'youtu.be' || youtube.includes(host)) {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = host === 'youtu.be' ? parts[0] : url.pathname === '/watch'
        ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : '';
      return id && /^[\w-]{11}$/.test(id) ? { kind: 'youtube', value: id } : { kind: 'invalid', value: '' };
    }
    if (IMAGE_EXTS.test(url.pathname)) return { kind: 'image', value: url.href };
    return { kind: 'file', value: url.href };
  } catch { return { kind: 'invalid', value: '' }; }
}

function Movie({ url, sound }: {
  url: string; sound: boolean;
}) {
  const source = useMemo(() => resolveVideo(url), [url]);
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const player = useRef<Player | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError(''); setStarted(false);
    if (source.kind !== 'youtube' || !host.current) return;
    let disposed = false;
    const root = host.current;
    const mount = document.createElement('div');
    root.appendChild(mount);
    void loadYouTube().then(api => {
      if (disposed) return;
      player.current = new api.Player(mount, {
        videoId: source.value, width: '100%', height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          playsinline: 1,
          controls: 0,
          rel: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          showinfo: 0,
          autohide: 1,
          cc_load_policy: 0,
          autoplay: 1,
          mute: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (disposed) return;
            if (sound) player.current?.unMute();
            player.current?.playVideo();
          },
          onStateChange: (e) => {
            if (!disposed && e.data === 1) setStarted(true);
          },
          onError: () => { if (!disposed) setError('영상을 불러올 수 없습니다.'); },
        },
      });
    }).catch(() => { if (!disposed) setError('YouTube에 연결하지 못했습니다.'); });
    return () => { disposed = true; player.current?.destroy(); player.current = null; root.replaceChildren(); };
  }, [source, sound]);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.muted = !sound;
    void element.play().catch(() => setError('영상 안의 재생 버튼을 눌러 주세요.'));
  }, [source, sound]);

  return <div className="ec-media-frame">
    {source.kind === 'youtube' && <>
      <div ref={host} className="ec-youtube" />
      <div className="ec-youtube-overlay" />
      <div className={`ec-youtube-cover${started ? ' ec-youtube-cover--hidden' : ''}`} />
    </>}
    {source.kind === 'image' && <img src={source.value} alt=""
      className="ec-media-img"
      onError={() => setError('이미지를 불러올 수 없습니다.')} />}
    {source.kind === 'file' && <video ref={video} src={source.value}
      playsInline autoPlay preload="metadata" muted={!sound}
      onPlaying={() => { setError(''); setStarted(true); }}
      onError={() => setError('재생 가능한 MP4/WebM 파일 URL인지 확인해 주세요.')} />}
    {(source.kind === 'invalid' || error) && <p className="ec-media-error" role="status">
      {error || '영상 또는 이미지 URL을 입력해 주세요.'}
    </p>}
  </div>;
}


export default function EndingCredits({ data, onComplete, isPreview }: SlideProps<EndingCreditsData>) {
  const credits = useMemo(() => parseCredits(data.credits), [data.credits]);
  const withVideo = data.mode === 'video';
  const speed = Number.isFinite(data.speed) ? Math.min(80, Math.max(10, data.speed!)) : 28;

  const viewport = useRef<HTMLDivElement>(null);
  const roll = useRef<HTMLDivElement>(null);
  const distance = useRef(0);
  const dimensions = useRef({ height: 0, total: 1 });
  const finished = useRef(false);
  const callbacks = useRef({ onComplete, isPreview });
  useEffect(() => { callbacks.current = { onComplete, isPreview }; }, [onComplete, isPreview]);

  const [playing, setPlaying] = useState(true);

  const paint = useCallback(() => {
    if (roll.current) roll.current.style.transform = `translate3d(0, ${dimensions.current.height - distance.current}px, 0)`;
  }, []);

  // 콘텐츠 변경 시 처음부터 재시작
  useEffect(() => {
    distance.current = 0; finished.current = false;
    setPlaying(true); paint();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.movieTitle, data.endMessage, data.subtitle, data.credits, data.mode, data.videoUrl]);

  useEffect(() => {
    const view = viewport.current; const content = roll.current;
    if (!view || !content) return;
    const measure = () => {
      dimensions.current = { height: view.clientHeight, total: view.clientHeight + content.scrollHeight };
      paint();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(view); observer.observe(content); measure();
    return () => observer.disconnect();
  }, [paint]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0; let previous: number | null = null;
    const tick = (now: number) => {
      const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (!document.hidden) distance.current += speed * dt;
      if (distance.current >= dimensions.current.total) {
        distance.current = dimensions.current.total; paint();
        setPlaying(false);
        if (!finished.current) {
          finished.current = true;
          if (!callbacks.current.isPreview) callbacks.current.onComplete?.();
        }
        return;
      }
      paint(); frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, paint]);

  return <section className={`ec-root${withVideo ? ' ec-with-video' : ''}`} aria-label="엔딩 크레딧">
    <div className="ec-stage">
      {withVideo && (
        <aside className="ec-media">
          <Movie url={data.videoUrl || ''} sound={data.enableSound} />
        </aside>
      )}
      <div ref={viewport} className="ec-viewport">
        <div ref={roll} className="ec-roll">
          <header className="ec-heading">
            {data.subtitle && <p className="ec-eyebrow">{data.subtitle}</p>}
            <h1>{data.movieTitle}</h1>
            <span className="ec-rule" />
          </header>
          <div className="ec-credits">
            {credits.map((credit, index) => (
              <div key={index}>
                {credit.section && credit.section !== credits[index - 1]?.section && (
                  <h2 className="ec-section">{credit.section}</h2>
                )}
                <div className={`ec-credit${credit.role ? '' : ' ec-name-only'}`}>
                  {credit.role && <p className="ec-role">{credit.role}</p>}
                  <p className="ec-name">{credit.name}</p>
                </div>
              </div>
            ))}
          </div>
          <footer className="ec-ending">
            <span className="ec-rule" />
            <p>{data.endMessage}</p>
            <span className="ec-the-end">THE END</span>
          </footer>
        </div>
      </div>
    </div>
  </section>;
}
