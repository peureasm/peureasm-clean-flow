
import { LaundryRequest, Hospital, LaundryItem } from './types';

export const HOSPITALS: Hospital[] = [
  { id: 'h1', name: '서울메디컬병원', address: '서울시 강남구', contact: '02-1234-5678' },
  { id: 'h2', name: '연세세브란스(신촌)', address: '서울시 서대문구', contact: '02-888-9999' },
  { id: 'h3', name: '아산종합병원', address: '서울시 송파구', contact: '02-777-6666' },
];

export const LAUNDRY_ITEMS: LaundryItem[] = [
  { id: 'i1', name: '환자복(상/하)', unit: '세트', pricePerUnit: 1200 },
  { id: 'i2', name: '침대시트', unit: '매', pricePerUnit: 800 },
  { id: 'i3', name: '베개커버', unit: '매', pricePerUnit: 300 },
  { id: 'i4', name: '수술복', unit: '세트', pricePerUnit: 1500 },
  { id: 'i5', name: '수건', unit: '매', pricePerUnit: 200 },
];

export const DUMMY_REQUESTS: LaundryRequest[] = [
  {
    id: 'REQ-20240501-001',
    hospitalId: 'h1',
    hospitalName: '서울메디컬병원',
    createdAt: '2024-05-01T09:00:00Z',
    requestDate: '2024-05-01',
    preferredTime: '오전 10:00',
    status: '제출',
    items: [
      { itemId: 'i1', itemName: '환자복(상/하)', hospitalQty: 50 },
      { itemId: 'i2', itemName: '침대시트', hospitalQty: 30 },
    ],
    flags: {
      isContaminated: false,
      isLeaking: false,
      isDoublePacked: true,
      isLabeled: true,
    },
    photos: [],
    history: [
      { status: '제출', timestamp: '2024-05-01T09:00:00Z', actor: '병원담당자(김철수)' }
    ]
  },
  {
    id: 'REQ-20240501-002',
    hospitalId: 'h2',
    hospitalName: '연세세브란스(신촌)',
    createdAt: '2024-04-30T17:00:00Z',
    requestDate: '2024-05-01',
    preferredTime: '오후 02:00',
    status: '공장입고',
    items: [
      { itemId: 'i1', itemName: '환자복(상/하)', hospitalQty: 100, driverQty: 98, factoryQty: 98 },
      { itemId: 'i3', itemName: '베개커버', hospitalQty: 40, driverQty: 40, factoryQty: 38 },
    ],
    discrepancyReason: '세탁물 분실 의심 (기사 확인 시 2벌 부족)',
    flags: {
      isContaminated: true,
      isLeaking: false,
      isDoublePacked: false,
      isLabeled: true,
    },
    photos: ['https://picsum.photos/seed/disc1/200/200'],
    history: [
      { status: '제출', timestamp: '2024-04-30T17:00:00Z', actor: '병원담당자(박영희)' },
      { status: '수거완료', timestamp: '2024-05-01T10:30:00Z', actor: '기사(이민수)' },
      { status: '공장입고', timestamp: '2024-05-01T13:00:00Z', actor: '공장(최진혁)' }
    ]
  },
  {
    id: 'REQ-20240501-003',
    hospitalId: 'h1',
    hospitalName: '서울메디컬병원',
    createdAt: '2024-05-01T08:00:00Z',
    requestDate: '2024-05-01',
    preferredTime: '오전 09:30',
    status: '납품완료',
    items: [
      { itemId: 'i4', itemName: '수술복', hospitalQty: 20, driverQty: 20, factoryQty: 20, deliveryQty: 20 },
    ],
    flags: {
      isContaminated: false,
      isLeaking: false,
      isDoublePacked: true,
      isLabeled: true,
    },
    photos: [],
    history: [
      { status: '제출', timestamp: '2024-05-01T08:00:00Z', actor: '병원담당자(김철수)' },
      { status: '수거완료', timestamp: '2024-05-01T09:30:00Z', actor: '기사(이민수)' },
      { status: '납품완료', timestamp: '2024-05-01T16:00:00Z', actor: '기사(이민수)' }
    ]
  }
];
