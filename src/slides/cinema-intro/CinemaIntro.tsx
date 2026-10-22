import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SlideProps } from '../SlideProps';
import { useSlideComplete } from '../useSlideComplete';
import { TextIntro, normalizeEnglishText } from '../../components/TextIntro';
import ArchedWordmark from '../../components/ArchedWordmark';
import RankNumber from '../../components/RankNumber';
import { cinemaDefaults } from './schema';
import type { CinemaIntroData, CinemaProfile, CinemaEpisode } from './types';
import '../../assets/fonts/fonts.css';
import './cinema-intro.css';

function readItems<T>(value: unknown, keys: string[]): T[] {
  try { const rows:unknown = typeof value==='string' ? JSON.parse(value) : value;
    if(!Array.isArray(rows)) return [];
    return rows.filter((row): row is T => !!row && typeof row==='object' && keys.every(key=>typeof (row as Record<string,unknown>)[key]==='string'));
  } catch { return []; }
}
function Photo({src,alt,style}:{src:string;alt:string;style?:CSSProperties}) {
  const [failed,setFailed]=useState(false); useEffect(()=>setFailed(false),[src]);
  return src && !failed ? <img src={src} alt={alt} onError={()=>setFailed(true)} style={style} /> : <div className="jc-cinema-placeholder" role="img" aria-label={alt} style={style}><span>♡</span></div>;
}
function PlayIcon() { return <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path fill="currentColor" d="M2 0L18 10 2 20Z"/></svg>; }
export default function CinemaIntro({data,onComplete,isPreview}:SlideProps<CinemaIntroData>) {
  const d = {...cinemaDefaults,...data};
  const introText = normalizeEnglishText(d.introText) || "N";
  const brand = d.brandName.trim() || introText;
  const [saved,setSaved]=useState<string[]>([]),[liked,setLiked]=useState<string[]>([]);
  const rootRef=useRef<HTMLDivElement>(null), dialogRef=useRef<HTMLDivElement>(null), closeRef=useRef<HTMLButtonElement>(null);
  const returnFocusRef=useRef<HTMLElement|null>(null);
  const [width,setWidth]=useState(0),[height,setHeight]=useState(0);
  const [stage,setStage]=useState<'intro'|'profiles'|'home'>('intro');
  const [profile,setProfile]=useState(0);
  const [details,setDetails]=useState<CinemaEpisode|'main'|null>(null);
  const complete=useSlideComplete(onComplete,isPreview);
  const profiles=readItems<CinemaProfile>(d.profiles,['name','image']).slice(0,3);
  const episodes=readItems<CinemaEpisode>(d.episodes,['title','image','description']);
  const rawIntroDuration=Number(d.introDuration);
  const introDurationMs=Math.min(12000,Math.max(2000,Number.isFinite(rawIntroDuration)?(rawIntroDuration>100?rawIntroDuration:rawIntroDuration*1000):5000));
  const isWide=width>=600;
  const ready=useCallback(()=>setStage(d.showProfiles && profiles.length ? 'profiles':'home'),[d.showProfiles,profiles.length]);
  useEffect(()=>{ const el=rootRef.current;if(!el)return;const ro=new ResizeObserver(([entry])=>{setWidth(entry.contentRect.width);setHeight(entry.contentRect.height);});ro.observe(el);return()=>ro.disconnect();},[]);
  useEffect(()=>{if(stage==='profiles' && (!d.showProfiles || !profiles.length))setStage('home');},[d.showProfiles,profiles.length,stage]);
  useEffect(()=>{
    if(!details)return;
    returnFocusRef.current=document.activeElement instanceof HTMLElement ? document.activeElement:null;
    closeRef.current?.focus();
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setDetails(null);
      if(event.key==='Tab') {
        const buttons=dialogRef.current?.querySelectorAll<HTMLElement>('button,[href],[tabindex="0"]');
        if(!buttons?.length)return;
        const first=buttons[0], last=buttons[buttons.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',keydown);
    return()=>{document.removeEventListener('keydown',keydown);returnFocusRef.current?.focus();};
  },[details]);
  const selected=profiles[Math.min(profile,Math.max(0,profiles.length-1))];
  const main=details==='main';
  const detailTitle=main?d.movieTitle:details?.title;
  const style = {'--jc-accent':d.accentColor,'--jc-bg':d.backgroundColor,'--jc-pad':isWide?'5%':'6%','--jc-title':`${Math.min(isWide?64:40,Math.max(isWide?30:25,width*(isWide?.045:.09)))}px`,'--jc-card-h':`${isWide?Math.max(96,Math.min(245,height*.26)):Math.max(100,Math.min(164,height*.20))}px`,position:'absolute',inset:0,display:'flex',flexDirection:'column',background:d.backgroundColor} as CSSProperties;
  return <div ref={rootRef} className={`jc-cinema ${isWide?'jc-cinema-wide':'jc-cinema-mobile'}`} style={style}>
    {stage==='intro' && <TextIntro text={introText} fontFamily={d.introFontFamily} color={d.accentColor} backgroundColor={d.backgroundColor} durationMs={introDurationMs} reducedMotion={d.reducedMotion} onFinished={ready}/>}
    {stage==='profiles' && <section className="jc-cinema-profiles jc-cinema-enter" aria-label="프로필 선택">
      <header className="jc-cinema-profile-header"><ArchedWordmark text={brand} color={d.accentColor}/></header><h1 style={{color: 'white'}}>{d.profileTitle.replace(/넷플릭스|럽플릭스|LUVFLIX/g,brand)}</h1><div className="jc-cinema-profile-grid">{profiles.map((p,i)=><button key={i} className="jc-cinema-profile" aria-label={p.name} onClick={()=>{setProfile(i);setStage('home');}}><Photo src={p.image} alt={p.name}/><span>{p.name}</span></button>)}</div>
    </section>}
    {stage==='home' && <>
      <div className="jc-cinema-home jc-cinema-enter" inert={details!==null}>
        <div className="jc-cinema-backdrop"><Photo src={d.heroImage} alt=""/><div/></div>
        <header className="jc-cinema-header"><ArchedWordmark text={brand} color={d.accentColor}/>{profiles.length>0 && <button className="jc-cinema-account" onClick={()=>setStage('profiles')} aria-label="프로필 변경"><Photo src={selected?.image||''} alt={selected?.name||'프로필'}/><svg className="jc-account-arrow" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2"/></svg></button>}</header>
        <main className="jc-cinema-copy"><div className="jc-cinema-eyebrow"><b>{brand.slice(0,1)}</b><span>영화</span></div><h1>{d.movieTitle}</h1><div className="jc-cinema-ranking"><span>TOP<br/>10</span><strong>{d.badgeText}</strong></div><p>{d.description}</p><div className="jc-cinema-actions"><button className="jc-cinema-play" onClick={onComplete?complete:()=>setDetails('main')}><PlayIcon/>{d.playLabel}</button><button className="jc-cinema-info" onClick={()=>setDetails('main')}><span aria-hidden="true">ⓘ</span>{d.detailLabel}</button></div></main>
        {episodes.length>0 && <section className="jc-cinema-series"><div className="jc-series-heading"><h2>{d.seriesTitle}</h2></div><div className="jc-cinema-episodes">{episodes.map((episode,i)=><button key={i} className={`jc-cinema-episode ${i>=9?"jc-cinema-two-digit":""}`} aria-label={`${i+1}. ${episode.title} 상세 보기`} onClick={()=>setDetails(episode)}><RankNumber value={i+1}/><Photo src={episode.image} alt={episode.title}/></button>)}</div></section>}
      </div>
      {details && <div className="jc-cinema-overlay" onClick={event=>{if(event.target===event.currentTarget)setDetails(null);}}>
        <div ref={dialogRef} className="jc-cinema-dialog jc-cinema-enter" role="dialog" aria-modal="true" aria-label={detailTitle}>
          <div className="jc-cinema-detail-hero"><div className="jc-cinema-detail-photo"><Photo src={main?(d.detailImage||d.heroImage):(details.detailImage||details.image)} alt={detailTitle||''}/></div>
          <button ref={closeRef} className="jc-cinema-close" onClick={()=>setDetails(null)} aria-label="상세 정보 닫기"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="2"/></svg></button>
          <div className="jc-cinema-detail-copy"><h2>{detailTitle}</h2><div className="jc-cinema-actions"><button className="jc-cinema-play" onClick={onComplete?complete:()=>setDetails('main')}><PlayIcon/>{d.playLabel}</button><button className="jc-cinema-round" aria-label="내가 찜한 목록" aria-pressed={saved.includes(detailTitle||"")} onClick={()=>setSaved(v=>v.includes(detailTitle||"")?v.filter(t=>t!==detailTitle):[...v,detailTitle||""])}>{saved.includes(detailTitle||"")?"✓":"+"}</button><button className="jc-cinema-round" aria-label="좋아요" aria-pressed={liked.includes(detailTitle||"")} onClick={()=>setLiked(v=>v.includes(detailTitle||"")?v.filter(t=>t!==detailTitle):[...v,detailTitle||""])}>{liked.includes(detailTitle||"")?"♥":"♡"}</button></div></div></div><div className="jc-cinema-detail-body"><div className="jc-cinema-detail-description"><div className="jc-cinema-ranking"><span>TOP<br/>10</span><strong>{d.badgeText}</strong></div><p>{main?d.description:details.description}</p></div><div className="jc-cinema-meta"><span>출연: <b>{d.cast}</b></span><span>장르: <b>{d.genre}</b></span></div></div>
        </div>
      </div>}
    </>}
  </div>;
}
