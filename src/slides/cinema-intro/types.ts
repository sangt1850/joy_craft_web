export interface CinemaProfile { name:string; image:string; }
export interface CinemaEpisode { detailImage?:string; title:string; image:string; description:string; }
export interface CinemaIntroData {
  introText:string; introFontFamily?:string;
  brandName:string; profileTitle:string; profiles:string|CinemaProfile[];
  heroImage:string; detailImage:string; movieTitle:string; badgeText:string; description:string;
  cast:string; genre:string; seriesTitle:string; episodes:string|CinemaEpisode[];
  playLabel:string; detailLabel:string; backgroundColor:string; accentColor:string;
  introDuration:number; showProfiles:boolean; reducedMotion:boolean;
}
