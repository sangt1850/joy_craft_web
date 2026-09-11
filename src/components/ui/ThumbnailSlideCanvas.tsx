// 썸네일 전용 SlideCanvas 래퍼.
// isPreview=true -> 슬라이드가 onComplete를 호출해도 다음 슬라이드로 넘어가지 않음.
// onSkip=noop -> 에러 폴백 버튼이 있어도 클릭해도 아무 일 없음.
import SlideCanvas from "../player/SlideCanvas";

interface ThumbnailSlideCanvasProps {
  slideKey: string;
  componentRef: string;
  values: Record<string, unknown>;
}

const noop = () => {};

export default function ThumbnailSlideCanvas({
  slideKey,
  componentRef,
  values,
}: ThumbnailSlideCanvasProps) {
  return (
    <SlideCanvas
      slideKey={slideKey}
      componentRef={componentRef}
      values={values}
      isPreview={true}
      onSkip={noop}
    />
  );
}
