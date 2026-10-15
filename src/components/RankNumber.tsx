import {useLayoutEffect,useRef,useState} from 'react';
export default function RankNumber({value}:{value:number}){
 const ref=useRef<SVGTextElement>(null);const [box,setBox]=useState('0 0 160 210');
 useLayoutEffect(()=>{const ctx=document.createElement('canvas').getContext('2d');if(ctx){ctx.font='900 270px Arial';const m=ctx.measureText(String(value));const w=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,h=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;if(w&&h){setBox(`${-m.actualBoundingBoxLeft-3} ${200-m.actualBoundingBoxAscent-3} ${w+6} ${h+6}`);return;}}const b=ref.current?.getBBox();if(b&&b.height)setBox(`${b.x-3} ${b.y-3} ${b.width+6} ${b.height+6}`);},[value]);
 return <svg className="jc-rank-number" viewBox={box} preserveAspectRatio="xMaxYMid meet" aria-hidden="true"><text ref={ref} x="0" y="200" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="270" fill="#141414" stroke="#777" strokeWidth="3" strokeLinejoin="round">{value}</text></svg>;
}
