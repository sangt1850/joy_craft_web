import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Gift, Heart } from 'lucide-react';
import type { SlideProps } from '../SlideProps';
import { useSlideComplete } from '../useSlideComplete';
import { useSlideTimeout } from '../useSlideTimeout';
import { safeHttpUrl, safeImageUrl, type CorgiGiftData } from './schema';
import './CorgiGift.css';

type Phase = 'loading' | 'delivery' | 'drop' | 'open' | 'reveal';

function ProductImage({ src, className, alt }: { src: string; className?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const resolved = failed ? '/assets/latte.png' : (safeImageUrl(src) || '/assets/latte.png');
  return (
    <img
      className={className}
      src={resolved}
      alt={alt}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

export default function CorgiGift({ data, onComplete, isPreview }: SlideProps<CorgiGiftData>) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 390, height: 760 });
  const [phase, setPhase] = useState<Phase>('loading');
  const [coupon, setCoupon] = useState(false);
  const [boxReady, setBoxReady] = useState(false);
  const opening = useRef(false);
  const [couponError, setCouponError] = useState(false);
  const complete = useSlideComplete(onComplete, isPreview);
  const later = useSlideTimeout();
  const give = data.mode === 'give';
  const url = safeHttpUrl(data.shoppingUrl);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ width: e.contentRect.width, height: e.contentRect.height })
    );
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    const timerIds: ReturnType<typeof setTimeout>[] = [];
    const start = () => {
      if (!alive) return;
      setPhase('delivery');
      timerIds.push(later(() => setPhase('drop'), 2350));
    };
    const sources = [
      '/assets/corgi.png',
      '/assets/gift.png',
      safeImageUrl(data.productImage) || '/assets/latte.png',
    ];
    const images = sources.map(
      (src) =>
        new Promise<void>((resolve) => {
          const im = new Image();
          im.onload = () => resolve();
          im.onerror = () => resolve();
          im.src = src;
        })
    );
    let started = false;
    const once = () => { if (!started) { started = true; start(); } };
    Promise.all(images).then(once);
    timerIds.push(later(once, 4500));
    return () => { alive = false; timerIds.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setCouponError(false), [data.couponImage]);

  const openGift = () => {
    if (phase !== 'drop' || !boxReady || opening.current) return;
    opening.current = true;
    setPhase('open');
    later(() => setPhase('reveal'), 750);
  };

  const reveal = phase === 'reveal';
  const compact = size.height < 630;

  return (
    <div
      ref={root}
      className={`jc-gift ${compact ? 'jc-compact' : ''}`}
      style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        background: `linear-gradient(180deg, ${data.backgroundColor} 0%, #294875 72%, #355887 100%)`,
        '--jc-accent': data.accentColor,
      } as CSSProperties}
    >
      <div className="jc-grain" aria-hidden="true" />

      <div className="jc-top">
        {/*<span className="jc-wordmark">joycraft<span>✳</span></span>*/}
        {/*<span className="jc-delivery-label">마음을 배달하는 중</span>*/}
      </div>

      <div className="jc-stage" aria-live="polite">
        {phase === 'loading' && (
          <div className="jc-loading">
            <span />
            <p>코기가 선물을 챙기고 있어요</p>
          </div>
        )}

        {phase === 'delivery' && (
          <>
            <div className="jc-flight">
              <img src="/assets/corgi.png" alt="빨간 망토를 두르고 날아가는 웰시코기" />
            </div>
            {/*<div className="jc-intro-copy">*/}
              {/*<span>SPECIAL DELIVERY</span>*/}
              {/*<h1>{data.recipientName}에게<br />선물이 도착하고 있어요</h1>*/}
            {/*</div>*/}
            <div className="jc-shower" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className="jc-falling-item"
                  style={{
                    left: `${[9, 72, 42, 85, 21, 61, 3][i]}%`,
                    animationDelay: `${.5 + i * .16}s`,
                    width: `${[75, 88, 65, 96, 80, 60, 64][i]}px`,
                  } as CSSProperties}
                >
                  <ProductImage src="/assets/gift.png" alt="" />
                </div>
              ))}
            </div>
          </>
        )}

        {(phase === 'drop' || phase === 'open') && (
          <div className={`jc-box-sequence ${phase === 'open' ? 'jc-box-opening' : ''}`}>
            <button
              type="button"
              className="jc-box-trigger"
              disabled={!boxReady || phase !== 'drop'}
              onClick={openGift}
              aria-label="선물상자 열기"
            >
              <span className="jc-box-frame">
                <span className="jc-box-glow" aria-hidden="true" />
                <img
                  src="/assets/gift.png"
                  className="jc-box"
                  alt="분홍색 선물상자"
                  draggable={false}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'jc-corgi-drop') setBoxReady(true);
                  }}
                />
              </span>
              {/*<span className="jc-box-hint">선물상자를 눌러 열어보세요</span>*/}
            </button>
          </div>
        )}

        {reveal && (
          <div className="jc-reveal">
            <div className="jc-reveal-heading">
              <div className="jc-eyebrow">
                <span /> {data.eyebrowLabel}
              </div>
              <h1>{data.headlineText}</h1>
              <p>{data.subtitleText}</p>
            </div>

            <div className="jc-product-stage">
              <div className="jc-rays" />
              <div className="jc-halo" />
              <ProductImage src={data.productImage} className="jc-product" alt={data.productName} />
              <span className="jc-spark jc-spark-one">✦</span>
              <span className="jc-spark jc-spark-two">✧</span>
              <span className="jc-spark jc-spark-three">✦</span>
            </div>

            <div className="jc-product-info">
              <span className="jc-brand">{data.brandName}</span>
              <h2>{data.productName}</h2>
              <p>{data.description}</p>
              <div className="jc-sender">
                <Heart size={13} />
                <span>마음을 담아, {data.senderName}</span>
              </div>
            </div>

            <div className="jc-action-area">
              {give ? (
                <>
                  <a
                    className={`jc-primary ${!url ? 'jc-disabled' : ''}`}
                    href={url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!url}
                    onClick={(e) => {
                      if (!url) { e.preventDefault(); return; }
                      complete();
                    }}
                  >
                    <span>링크 이동하기</span>
                    <ArrowUpRight size={20} />
                  </a>
                  <p>{url ? '선물을 고를 수 있는 쇼핑몰로 이동해요' : '아직 쇼핑몰 링크가 등록되지 않았어요'}</p>
                </>
              ) : (
                <>
                  <button className="jc-primary" onClick={() => setCoupon(true)}>
                    <Gift size={19} />
                    <span>선물 받기</span>
                  </button>
                  <p>나만을 위한 기프티콘을 확인해 보세요</p>
                </>
              )}
            </div>
          </div>
        )}

        {reveal && (
          <div className="jc-confetti" aria-hidden="true">
            {Array.from({ length: 26 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: ['#ff819f', '#ffe478', '#8adfff', '#fff'][i % 4],
                  animationDelay: `${i * .035}s`,
                  transform: `rotate(${i * 23}deg)`,
                } as CSSProperties}
              />
            ))}
          </div>
        )}
      </div>

      {/*<footer className="jc-footer">*/}
      {/*  <span>DELIVERED WITH LOVE</span>*/}
      {/*  <Heart size={10} />*/}
      {/*  <span>JOYCRAFT</span>*/}
      {/*</footer>*/}

      {coupon && (
        <div
          className="jcg-coupon-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="기프티콘"
          onClick={(e) => {
            if (e.target === e.currentTarget) { setCoupon(false); complete(); }
          }}
        >
          <div className="jcg-coupon-panel">
            <div className="jc-coupon-heading">
              <span>JUST FOR YOU</span>
              <button
                aria-label="기프티콘 닫기"
                className="jc-close"
                onClick={() => { setCoupon(false); complete(); }}
              >
                ✕
              </button>
            </div>
            <h2 className="jc-coupon-title">마음까지 전해졌어요!</h2>
            <p className="jcg-coupon-desc">{data.senderName}이 보낸 선물이에요.</p>
            {safeImageUrl(data.couponImage) && !couponError ? (
              <img
                className="jc-coupon-image"
                src={safeImageUrl(data.couponImage)}
                alt={`${data.productName} 기프티콘`}
                onError={() => setCouponError(true)}
              />
            ) : (
              <div className="jc-coupon-empty">
                <Gift size={32} />
                <p>{couponError ? '기프티콘 이미지를 불러오지 못했어요.' : '아직 기프티콘이 등록되지 않았어요.'}</p>
              </div>
            )}
            <button
              className="jc-coupon-done"
              onClick={() => { setCoupon(false); complete(); }}
            >
              확인했어요 <Heart size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
