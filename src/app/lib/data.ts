
import { LaundryRequest, Hospital, LaundryItem } from './types';

/**
 * 시스템 마스터 데이터: 병원 목록
 * 정식 테스트를 위해 모든 더미 데이터를 제거했습니다.
 */
export const HOSPITALS: Hospital[] = [];

/**
 * 시스템 마스터 데이터: 세탁 품목 정의
 * 해당 데이터는 시스템의 표준 품목으로 유지됩니다.
 */
export const LAUNDRY_ITEMS: LaundryItem[] = [
  { id: 'i1', name: '환자복(상/하)', unit: '세트', pricePerUnit: 1200 },
  { id: 'i2', name: '침대시트', unit: '매', pricePerUnit: 800 },
  { id: 'i3', name: '베개커버', unit: '매', pricePerUnit: 300 },
  { id: 'i4', name: '수술복', unit: '세트', pricePerUnit: 1500 },
  { id: 'i5', name: '수건', unit: '매', pricePerUnit: 200 },
];

/**
 * 세탁 요청 데이터
 * 모든 실제 데이터는 Firestore에서 호출되며, 초기 상태는 비어 있습니다.
 */
export const DUMMY_REQUESTS: LaundryRequest[] = [];
