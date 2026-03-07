
export type UserRole = 'HOSPITAL' | 'DRIVER' | 'FACTORY' | 'ADMIN';

export type LaundryStatus =
  | '임시저장'
  | '제출'
  | '수거완료'
  | '공장입고'
  | '세탁중'
  | '건조중'
  | '포장완료'
  | '출고'
  | '납품완료'
  | '병원확인완료'
  | '종결';

export interface LaundryItem {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
}

export interface RequestItem {
  itemId: string;
  itemName: string;
  hospitalQty: number;
  driverQty?: number;
  factoryQty?: number;
  deliveryQty?: number;
}

export interface LaundryRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  createdAt: string;
  requestDate: string;
  preferredTime: string;
  status: LaundryStatus;
  items: RequestItem[];
  memo?: string;
  photos: string[];
  discrepancyReason?: string;
  flags: {
    isContaminated: boolean;
    isLeaking: boolean;
    isDoublePacked: boolean;
    isLabeled: boolean;
  };
  history: {
    status: LaundryStatus;
    timestamp: string;
    actor: string;
  }[];
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  contact: string;
}
