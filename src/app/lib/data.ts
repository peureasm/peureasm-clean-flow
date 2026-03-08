
import { LaundryRequest, Hospital, LaundryItem } from './types';

/**
 * 시스템 마스터 데이터: 병원 목록 (초기화됨)
 * 정식 테스트 시 관리자 페이지에서 직접 등록하여 사용하십시오.
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
 * 세탁 요청 더미 데이터 (초기화됨)
 * 모든 데이터는 이제 Firestore 실시간 데이터베이스에서 호출됩니다.
 */
export const DUMMY_REQUESTS: LaundryRequest[] = [];
