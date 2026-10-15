import type { SlideSchema } from '../SlideProps';
import type { CinemaIntroData } from './types';
const profiles = [{name:'우리',image:'/images/profile-smile.svg'},{name:'키즈',image:'/images/profile-kids.svg'}];
const episodes = ['처음 만난 날','너와 함께한 계절','우리의 가장 빛나는 순간','그리고, 새로운 시작'].map((title,i)=>({title,image:`/images/episode-${i+1}.jpg`,detailImage:i===0?'/images/detail.jpg':`/images/episode-${i+1}.jpg`,description:'함께여서 더 특별했던 순간. 우리의 이야기는 계속됩니다.'}));
export const schema: SlideSchema = { fields: [
 {key:'introText',label:'인트로 문자 / 단어',type:'text',default:'LUVFLIX',hint:'영문 대문자·소문자와 공백만 지원합니다. 예: N, W, Love, JOYCRAFT. 접힘 면은 전용 영문 획 설계를 사용합니다.'},
 {key:'brandName',label:'브랜드 이름',type:'text',default:'LUVFLIX'},
 {key:'profileTitle',label:'프로필 선택 안내',type:'text',default:'시청할 프로필을 선택하세요.'},
 {key:'profiles',label:'프로필',type:'array',itemLabel:'프로필',default:JSON.stringify(profiles),itemFields:[{key:'name',label:'이름',type:'text',default:'새 프로필'},{key:'image',label:'사진',type:'image',default:''}]},
 {key:'heroImage',label:'메인 배경 사진',type:'image',default:'/images/hero.jpg'},
 {key:'detailImage',label:'상세 배경 사진',type:'image',default:'/images/detail.jpg'},
 {key:'movieTitle',label:'메인 제목',type:'text',default:'우리 결혼해요! ♡'},
 {key:'badgeText',label:'순위 문구',type:'text',default:'오늘 가장 빛나는 커플 1순위'},
 {key:'description',label:'소개',type:'textarea',default:'햇살이 가득했던 어느 날.\n둘은 처음 마주쳤을 때, 운명적인 순간이었음을 느꼈다.\n그 이후, 서로 깊이 빠져든 이들은 오늘 특별한 날을 맞이하게 되는데…'},
 {key:'cast',label:'출연',type:'text',default:'신랑, 신부'},
 {key:'genre',label:'장르',type:'text',default:'로맨스 · 우리의 이야기'},
 {key:'seriesTitle',label:'사진 목록 제목',type:'text',default:'우리의 결혼 여행기 TOP 10 시리즈'},
 {key:'episodes',label:'사진 카드',type:'array',itemLabel:'사진 카드',default:JSON.stringify(episodes),itemFields:[{key:'title',label:'제목',type:'text',default:'새로운 이야기'},{key:'image',label:'사진',type:'image',default:''},{key:'detailImage',label:'상세 사진',type:'image',default:''},{key:'description',label:'소개',type:'textarea',default:''}]},
 {key:'playLabel',label:'다음 슬라이드 버튼',type:'text',default:'재생'},
 {key:'detailLabel',label:'상세 버튼',type:'text',default:'상세 정보'},
 {key:'backgroundColor',label:'배경 색상',type:'color',default:'#000000'},
 {key:'accentColor',label:'인트로 / 강조 색상',type:'color',default:'#e50914'},
 {key:'introDuration',label:'인트로 길이 (초)',type:'number',default:5,min:2,max:12,step:.5},
 {key:'showProfiles',label:'프로필 선택 표시',type:'boolean',default:true},
 {key:'reducedMotion',label:'차분한 인트로 (확대·빛줄기 생략)',type:'boolean',default:false},
] };
export const defaultValues: Record<string,unknown> = Object.fromEntries(schema.fields.map(field=>[field.key,field.default]));
export const cinemaDefaults = defaultValues as unknown as CinemaIntroData;
