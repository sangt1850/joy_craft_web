import type { SlideSchema } from '../SlideProps';

export interface CorgiGiftData {
  mode: 'receive' | 'give';
  senderName: string;
  recipientName: string;
  eyebrowLabel: string;
  headlineText: string;
  subtitleText: string;
  productName: string;
  brandName: string;
  description: string;
  productImage: string;
  couponImage: string;
  shoppingUrl: string;
  backgroundColor: string;
  accentColor: string;
}

export const schema: SlideSchema = {
  fields: [
    { key: 'mode', label: '선물 버전', type: 'select', default: 'receive', options: [{ label: '선물 받기', value: 'receive' }, { label: '선물 주기', value: 'give' }] },
    { key: 'senderName', label: '링크 만든 사람', type: 'text', default: '지수', required: true },
    { key: 'recipientName', label: '받는 사람', type: 'text', default: '소중한 너', required: true },
    { key: 'eyebrowLabel', label: '부제목 레이블', type: 'text', default: '지수의 선물이 도착했어요' },
    { key: 'headlineText', label: '메인 문구', type: 'text', default: '너를 위해 준비했어' },
    { key: 'subtitleText', label: '설명 문구', type: 'text', default: '소중한 너의 하루에 작은 행복을' },
    { key: 'brandName', label: '브랜드 / 분류', type: 'text', default: 'A LITTLE COFFEE BREAK' },
    { key: 'productName', label: '상품 이름', type: 'text', default: '시원한 카페라떼 한 잔', required: true },
    { key: 'description', label: '상품 설명 / 메시지', type: 'textarea', default: '오늘도 수고한 너에게.\n잠깐 쉬어가도 괜찮아 ☕' },
    { key: 'productImage', label: '상품 이미지', type: 'image', default: '/assets/latte.png' },
    { key: 'couponImage', label: '기프티콘 이미지', type: 'image', default: '/assets/sample-coupon.png', hint: '선물 받기에서 공개할 기프티콘 이미지' },
    { key: 'shoppingUrl', label: '쇼핑몰 링크', type: 'text', default: '', hint: '선물 주기에서 이동할 https:// 주소' },
    { key: 'backgroundColor', label: '배경 색상', type: 'color', default: '#192632' },
    { key: 'accentColor', label: '버튼 색상', type: 'color', default: '#ffed78' },
  ],
};

export const defaultValues = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
) as unknown as CorgiGiftData;

export function safeHttpUrl(value: string): string {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

export function safeImageUrl(value: string): string {
  return value.startsWith('/assets/') ? value : safeHttpUrl(value);
}
