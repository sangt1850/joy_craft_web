import { useId } from "react";
import type { CSSProperties } from "react";
import type { NotificationApp, PhoneStyle } from "./types";

export function AppIcon({ app, size = 36 }: { app: NotificationApp; size?: number }) {
  const style: CSSProperties = { width: size, height: size, flex: "0 0 auto", borderRadius: size * .25, display: "grid", placeItems: "center", overflow: "hidden", boxShadow: "0 1px 2px #0000000d" };
  if (app === "instagram") return <span aria-hidden="true" style={{ ...style, background: "radial-gradient(circle at 28% 103%, #ffd776 0%, #ffb43a 20%, #f44362 43%, #c42caa 66%, #6449d9 96%)" }}><svg width="76%" height="76%" viewBox="0 0 32 32" fill="none"><rect x="5" y="5" width="22" height="22" rx="7" stroke="white" strokeWidth="2.4"/><circle cx="16" cy="16" r="5.3" stroke="white" strokeWidth="2.4"/><circle cx="23" cy="9.3" r="1.5" fill="white"/></svg></span>;
  if (app === "kakao") return <span aria-hidden="true" style={{ ...style, background: "#FEE500" }}><svg width="85%" height="85%" viewBox="0 0 36 36"><path d="M18 6C10.4 6 5 10.5 5 16.1c0 3.6 2.3 6.7 5.9 8.5l-1.2 4.6 5.2-3.1c1 .2 2 .3 3.1.3 7.6 0 13-4.5 13-10.3S25.6 6 18 6" fill="#3b2424"/><text x="18" y="19" fontSize="7.6" textAnchor="middle" fill="#FEE500" fontWeight="900" fontFamily="Arial,sans-serif">TALK</text></svg></span>;
  return <span aria-hidden="true" style={{ ...style, background: "linear-gradient(#65eb73,#10c939)" }}><svg width="85%" height="85%" viewBox="0 0 36 36"><path d="M18 6C10.6 6 5 10.5 5 16.5c0 3.7 2.2 6.8 5.5 8.7L9.2 30l5.4-3.3c1.1.3 2.2.4 3.4.4 7.4 0 13-4.6 13-10.6S25.4 6 18 6" fill="white"/></svg></span>;
}

export function Glyph({ name, size = 20 }: { name: "lock" | "flash" | "camera" | "signal" | "wifi" | "battery"; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {name === "lock" && <><rect x="6.5" y="10" width="11" height="10" rx="3" fill="currentColor" stroke="none"/><path d="M8.5 10V7a3.5 3.5 0 017 0v3"/></>}
    {name === "flash" && <><path d="M8 3h8v6l-2 3v8h-4v-8L8 9z" fill="currentColor" stroke="none"/><path d="M8 6h8" stroke="white" strokeOpacity=".65"/></>}
    {name === "camera" && <><path d="M3 8h4l2-3h6l2 3h4v12H3z" fill="currentColor" stroke="none"/><circle cx="12" cy="13.5" r="3.5" stroke="white" strokeOpacity=".65"/></>}
    {name === "signal" && <>{[0,1,2,3].map((i) => <rect key={i} x={3+i*5} y={17-i*4} width="3" height={4+i*4} rx=".8" fill="currentColor" stroke="none"/>)}</>}
    {name === "wifi" && <><path d="M3 9a14 14 0 0118 0M6.5 12.5a9 9 0 0111 0M10 16a3 3 0 014 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></>}
    {name === "battery" && <><rect x="1" y="6.5" width="19" height="11" rx="3" strokeOpacity=".5"/><rect x="3.5" y="9" width="14" height="6" rx="1.2" fill="currentColor" stroke="none"/><path d="M22 10v4"/></>}
  </svg>;
}

/** Code-native wallpaper: no remote requests or extra image assets. */
export function DefaultWallpaper({ device }: { device: PhoneStyle }) {
  const id = useId().replace(/:/g, "");
  return <svg aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 390 844" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
    <defs>
      <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={device === "iphone" ? "#e4e6f2" : "#e8edf0"}/><stop offset=".45" stopColor={device === "iphone" ? "#ddd9ed" : "#f5e8e9"}/><stop offset="1" stopColor={device === "iphone" ? "#b9afd3" : "#b7bddb"}/></linearGradient>
      <linearGradient id={`${id}petal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6f7ff" stopOpacity=".96"/><stop offset=".48" stopColor="#c5c1dd" stopOpacity=".76"/><stop offset=".84" stopColor="#9a8cad" stopOpacity=".85"/><stop offset="1" stopColor="#635879"/></linearGradient>
      <linearGradient id={`${id}pearl`} x1="0" y1="0" x2="1" y2=".9"><stop stopColor="#afc5d1"/><stop offset=".25" stopColor="#f4f5f6"/><stop offset=".56" stopColor="#eadce5"/><stop offset=".82" stopColor="#b3bcd4"/><stop offset="1" stopColor="#788fac"/></linearGradient>
      <radialGradient id={`${id}light`}><stop stopColor="white" stopOpacity=".45"/><stop offset="1" stopColor="white" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="390" height="844" fill={`url(#${id}bg)`}/>
    {device === "iphone" ? <g transform="translate(195 478)">
      {Array.from({length: 12}, (_, i) => <path key={i} transform={`rotate(${i * 30})`} d="M0 0C-10-77-119-159-55-407C-11-344 83-163 0 0Z" fill={`url(#${id}petal)`} opacity={i % 2 ? .67 : .88} stroke="#f7f5ff" strokeOpacity=".28" strokeWidth=".6"/>)}
    </g> : <g fill={`url(#${id}pearl)`} stroke="#eef1f7" strokeWidth="1" strokeOpacity=".55">
      <path d="M342 165C277 63 111 106 53 226C-13 361 106 430 208 506C320 590 309 703 192 751C372 756 431 570 341 455C246 333 139 315 128 242C116 165 249 123 342 165Z"/>
      <path d="M46 647C113 759 294 746 338 600C371 490 288 425 185 349C78 269 76 176 188 125C39 137-15 298 42 407C105 527 230 531 247 614C263 693 118 709 46 647Z" opacity=".55"/>
    </g>}
    <ellipse cx="108" cy="110" rx="320" ry="270" fill={`url(#${id}light)`}/>
    <rect width="390" height="844" fill="white" opacity=".045"/>
  </svg>;
}
