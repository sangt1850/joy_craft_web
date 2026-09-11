import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { SlideProps } from "../SlideProps";
import { useSlideComplete } from "../useSlideComplete";
import { useVibrate } from "../useVibrate";
import { AppIcon, DefaultWallpaper, Glyph } from "./visuals";
import { parseNotifications } from "./types";
import type { PhoneNotificationData, PhoneNotificationItem } from "./types";

const APP_NAMES = { sms: "메시지", instagram: "Instagram", kakao: "카카오톡" };
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif';
const ellipsis: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

function Avatar({ src, name, dark }: { src?: string | null; name: string; dark: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <span style={{ width: 36, height: 36, flex: "0 0 36px", overflow: "hidden", borderRadius: "50%", background: dark ? "#ffffff24" : "linear-gradient(145deg,#f6eced,#d4c4d7)", display: "grid", placeItems: "center", color: dark ? "#fff" : "#69536c", fontSize: 13, fontWeight: 600 }}>
    {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : Array.from(name.trim())[0] || "♡"}
  </span>;
}

function NotificationCard({ item, samsung, dark, onOpen, index }: { item: PhoneNotificationItem; samsung: boolean; dark: boolean; onOpen: () => void; index: number }) {
  const [focused, setFocused] = useState(false);
  return <button type="button" data-jc-notification={index} onClick={onOpen} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    aria-label={`${APP_NAMES[item.app]}, ${item.sender}: ${item.message}. 다음 슬라이드로 이동`}
    style={{ appearance: "none", WebkitTapHighlightColor: "transparent", touchAction: "manipulation", width: "100%", flex: "0 0 auto", minWidth: 0, minHeight: 92,
      border: `1px solid ${dark ? "#ffffff13" : "#ffffff65"}`, borderRadius: samsung ? 27 : 23, padding: samsung ? "15px 16px" : "13px 15px",
      background: dark ? "rgba(27,27,33,.87)" : "rgba(250,249,255,.76)", color: dark ? "#f9f8fc" : "#24222d",
      backdropFilter: "blur(26px) saturate(130%)", WebkitBackdropFilter: "blur(26px) saturate(130%)",
      boxShadow: "0 4px 16px #24203009, inset 0 1px 0 #ffffff18", outline: focused ? `3px solid ${dark ? "#c4bcff" : "#726290"}` : "none", outlineOffset: -3,
      cursor: "pointer", fontFamily: FONT, textAlign: "left", display: "flex", alignItems: "center", gap: 12,
      animation: "jc-phone-notification-in .52s cubic-bezier(.16,1,.3,1) both" }}>
    {samsung && <AppIcon app={item.app} size={38}/>}
    <span style={{ display: "block", flex: 1, minWidth: 0 }}>
      <span style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5, lineHeight: "16px" }}>
        {!samsung && <AppIcon app={item.app} size={18}/>}
        <span style={{ ...ellipsis, fontSize: samsung ? 12 : 11, fontWeight: samsung ? 650 : 550, opacity: .74 }}>{APP_NAMES[item.app]}</span>
        <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: 10, opacity: .48 }}>지금</span>
      </span>
      <span style={{ ...ellipsis, display: "block", fontSize: 14, fontWeight: 650, lineHeight: "20px", letterSpacing: "-.3px" }}>{item.sender}</span>
      <span style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", whiteSpace: "pre-line", overflowWrap: "anywhere", fontSize: 13, lineHeight: "19px", letterSpacing: "-.25px", opacity: .9 }}>{item.message}</span>
    </span>
    {(item.avatar || item.app === "instagram") && <Avatar src={item.avatar} name={item.sender} dark={dark}/>}
  </button>;
}

export default function PhoneNotification({ data, onComplete, isPreview }: SlideProps<PhoneNotificationData>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [now, setNow] = useState(() => new Date());
  const [revealed, setRevealed] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const complete = useSlideComplete(onComplete, isPreview);
  const vibrate = useVibrate();
  const feedbackRef = useRef({ vibrate, enabled: data.enableVibration, isPreview });
  feedbackRef.current = { vibrate, enabled: data.enableVibration, isPreview };
  const notifications = useMemo(() => parseNotifications(data.notifications), [data.notifications]);
  const timelineKey = JSON.stringify(notifications);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (data.clockMode !== "live") return;
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [data.clockMode]);

  const ready = size.width > 0 && size.height > 0;
  useEffect(() => {
    setRevealed(0);
    if (!ready) return;
    const items = JSON.parse(timelineKey) as PhoneNotificationItem[];
    let elapsed = 0;
    const timers = items.map((item, index) => {
      elapsed += item.delay * 1000;
      return window.setTimeout(() => {
        setRevealed(index + 1);
        const feedback = feedbackRef.current;
        if (feedback.enabled && !feedback.isPreview) {
          try { feedback.vibrate([35, 35, 35]); } catch { /* Unsupported devices remain silent. */ }
        }
      }, elapsed);
    });
    return () => timers.forEach(window.clearTimeout);
  }, [timelineKey, ready]);

  useEffect(() => { listRef.current?.scrollTo({ top: 0, behavior: "auto" }); }, [revealed]);
  const wallpaper = typeof data.wallpaper === "string" ? data.wallpaper.trim() : "";
  useEffect(() => setImageFailed(false), [wallpaper]);

  const samsung = data.deviceStyle === "samsung";
  const dark = data.notificationTheme === "dark";
  const desktop = size.width >= 600;
  const deviceScale = desktop ? Math.max(.1, Math.min(1, (size.height - 56) / 830, (size.width - 64) / 394)) : 1;
  const mobileScale = Math.max(.1, Math.min(1.25, size.width / 390));
  const contentScale = desktop ? 1 : mobileScale;
  const canvasWidth = desktop ? 374 : size.width / contentScale;
  const canvasHeight = desktop ? 810 : size.height / contentScale;
  const compact = canvasHeight < 670;
  const veryShort = canvasHeight < 450;
  const time = data.clockMode === "live" ? `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}` : data.time || "9:41";
  const dateText = data.clockMode === "live" ? new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(now) : data.dateText;
  const ink = data.clockColor || "#29263d";
  const visible = notifications.slice(0, revealed).map((item, index) => ({ item, index })).reverse();
  const openNotification = () => { complete(); };

  return <div ref={rootRef} data-jc-phone-root data-layout={desktop ? "desktop" : "mobile"} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", isolation: "isolate", background: data.backgroundColor || "#eeedf2", fontFamily: FONT, WebkitFontSmoothing: "antialiased" }}>
    {desktop && <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 20%,#ffffffcf,transparent 65%)" }}/>}
    <div style={desktop ? { position: "relative", width: 394 * deviceScale, height: 830 * deviceScale, flex: "0 0 auto" } : { position: "absolute", inset: 0 }}>
      <div data-jc-phone-device style={desktop ? { position: "absolute", width: 394, height: 830, top: 0, left: 0, transform: `scale(${deviceScale})`, transformOrigin: "top left", padding: 10, boxSizing: "border-box", borderRadius: samsung ? 43 : 58,
        background: "linear-gradient(120deg,#d6d6dc 0%,#fafafd 15%,#a0a0aa 36%,#f5f4f8 52%,#91919b 79%,#d3d2d9)", boxShadow: "0 28px 58px -18px #38304355, 0 4px 10px #2d263626, inset 0 0 0 1px #85838c, inset 0 0 0 3px #efedf2" } : { position: "absolute", inset: 0 }}>
        {desktop && <>
          <span aria-hidden="true" style={{ position: "absolute", top: 174, left: -3, width: 3, height: 64, borderRadius: "3px 0 0 3px", background: "linear-gradient(#dedde3,#8d8b96,#e5e5eb)" }}/>
          <span aria-hidden="true" style={{ position: "absolute", top: 253, left: -3, width: 3, height: 64, borderRadius: "3px 0 0 3px", background: "linear-gradient(#dedde3,#8d8b96,#e5e5eb)" }}/>
          <span aria-hidden="true" style={{ position: "absolute", top: 226, right: -3, width: 3, height: 90, borderRadius: "0 3px 3px 0", background: "linear-gradient(#dedde3,#8d8b96,#e5e5eb)" }}/>
        </>}
        <div style={{ position: "absolute", inset: desktop ? 6 : 0, borderRadius: desktop ? samsung ? 38 : 53 : 0, background: "#101014", padding: desktop ? 4 : 0, overflow: "hidden" }}>
          <div data-jc-phone-screen style={{ position: "relative", width: "100%", height: "100%", borderRadius: desktop ? samsung ? 34 : 49 : 0, overflow: "hidden", background: "#d4cde2", color: ink }}>
            <DefaultWallpaper device={samsung ? "samsung" : "iphone"}/>
            {wallpaper && !imageFailed && <img key={wallpaper} src={wallpaper} alt="" onError={() => setImageFailed(true)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}/>}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#ffffff14,transparent 48%,#302a4418)" }}/>
            <div style={{ position: "absolute", left: 0, top: 0, width: canvasWidth, height: canvasHeight, transform: `scale(${contentScale})`, transformOrigin: "top left", display: "flex", flexDirection: "column", boxSizing: "border-box", paddingTop: desktop ? 0 : "env(safe-area-inset-top, 0px)", paddingBottom: desktop ? 0 : "env(safe-area-inset-bottom, 0px)" }}>
              <div style={{ height: veryShort ? 32 : 54, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${samsung ? 25 : 29}px`, fontSize: 12, fontWeight: 600 }}>
                <span style={{ ...ellipsis, maxWidth: desktop && !samsung ? 90 : 130 }}>{data.carrier}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Glyph name="signal" size={16}/><Glyph name="wifi" size={17}/><Glyph name="battery" size={23}/></span>
              </div>
              {desktop && <div aria-hidden="true" style={samsung ? { position: "absolute", left: "50%", top: 13, transform: "translateX(-50%)", width: 10, height: 10, background: "#11121a", borderRadius: "50%", boxShadow: "0 0 0 2px #c4bfcd55, inset 0 0 0 3px #1c1c25" } : { position: "absolute", left: "50%", top: 11, transform: "translateX(-50%)", width: 112, height: 31, background: "#111115", borderRadius: 30, boxShadow: "inset 0 0 0 1px #202027" }}>
                {!samsung && <span style={{ position: "absolute", width: 8, height: 8, right: 12, top: 11, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%,#253446,#0d121d 65%)" }}/>}
              </div>}
              <header style={{ flexShrink: 0, textAlign: "center", paddingTop: veryShort ? 0 : compact ? 6 : samsung ? 29 : 19, paddingBottom: veryShort ? 8 : compact ? 14 : 28, display: "flex", flexDirection: "column", alignItems: "center", textShadow: "0 1px 14px #ffffff20" }}>
                {!veryShort && <span style={{ marginBottom: compact ? 5 : 12, opacity: .84 }}><Glyph name="lock" size={19}/></span>}
                {!samsung && <div style={{ fontSize: veryShort ? 13 : 17, fontWeight: 550, letterSpacing: "-.6px", maxWidth: "90%", ...ellipsis }}>{dateText}</div>}
                <div data-jc-clock style={{ fontSize: veryShort ? 58 : compact ? 76 : samsung ? 88 : 94, lineHeight: 1.06, fontWeight: samsung ? 350 : 650, letterSpacing: samsung ? "-4px" : "-5px", fontVariantNumeric: "tabular-nums", maxWidth: "95%", ...ellipsis }}>{time}</div>
                {samsung && <div style={{ fontSize: veryShort ? 13 : 16, fontWeight: 500, letterSpacing: "-.4px", marginTop: 8, maxWidth: "90%", ...ellipsis }}>{dateText}</div>}
              </header>
              <div ref={listRef} data-jc-notification-list aria-live="polite" aria-relevant="additions" aria-label="도착한 알림" tabIndex={0} style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", scrollbarWidth: "none", padding: `2px ${samsung ? 12 : 13}px 14px`, display: "flex", flexDirection: "column", gap: 9, outlineOffset: -3 }}>
                {visible.map(({item, index}) => (
                  <div key={`${timelineKey}:${index}`} data-jc-notification-wrap style={{ overflow: "hidden", animation: "jc-phone-notification-expand .52s cubic-bezier(.16,1,.3,1) both" }}>
                    <NotificationCard index={index} item={item} samsung={samsung} dark={dark} onOpen={openNotification}/>
                  </div>
                ))}
                {notifications.length === 0 && <button type="button" onClick={openNotification} style={{ alignSelf: "center", marginTop: 20, padding: "13px 25px", borderRadius: 30, border: "1px solid #ffffff88", background: "#ffffffa8", color: "#29263d", fontFamily: FONT, fontSize: 13, cursor: "pointer" }}>다음으로 이동</button>}
              </div>
              <footer style={{ flexShrink: 0, padding: veryShort ? "5px 28px 8px" : "12px 28px 9px", textAlign: "center" }}>
                {!veryShort && <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", marginBottom: compact ? 10 : 17 }}>
                  {(["flash", "camera"] as const).map((name) => <span key={name} style={{ width: 43, height: 43, borderRadius: "50%", background: "#ffffff35", backdropFilter: "blur(12px)", display: "grid", placeItems: "center" }}><Glyph name={name} size={21}/></span>)}
                </div>}
                {data.hint && <div style={{ fontSize: 11, lineHeight: "16px", opacity: .78, letterSpacing: "-.2px", marginBottom: veryShort ? 7 : 15 }}>{data.hint}</div>}
                <div aria-hidden="true" style={{ width: samsung ? 92 : 118, height: samsung ? 4 : 5, margin: "0 auto", background: "currentColor", opacity: .8, borderRadius: 10 }}/>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
