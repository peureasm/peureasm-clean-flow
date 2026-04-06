# Hospital Figma Proposal

## 목적
- 병원 역할 화면을 Figma에서 먼저 검토할 수 있도록, 바로 그릴 수 있는 수준의 시안 제안서를 정리한다.
- 현재 코드 구조와 병원 UX 스펙을 바탕으로 `병원 홈`, `신규 요청`, `요청 상세/최종 확인` 3개 핵심 화면을 제안한다.
- 이후 이 제안안을 기준으로 `src/app/hospital/*` 코드 구현까지 이어질 수 있게 한다.

## 제안 방향

### 핵심 컨셉
- 병원 사용자는 복잡한 운영 데이터를 보지 않는다.
- 첫 화면에서 "지금 할 일"과 "신규 요청"이 가장 먼저 보여야 한다.
- 요청 생성은 긴 폼이 아니라 작업 카드 묶음처럼 느껴져야 한다.
- 요청 상세는 정산 금액 확인과 최종 확인 흐름이 명확해야 한다.

### 시각 톤
- 밝고 신뢰감 있는 블루 계열
- 관리자보다 여백이 많고 정보 밀도가 낮음
- 위험/경고는 빨간색보다 오렌지와 경고 카드 위주
- 큰 버튼, 짧은 문장, 선명한 상태 배지

### 기본 토큰 사용
- Background: `#F2F4F7`
- Surface: `#FFFFFF`
- Primary: `#3151E5`
- Secondary: `#035690`
- Accent Surface: `#DFE9FF`
- Border: `#DDE1E8`
- Radius:
  - 카드 `24`
  - 버튼 `16`
  - 배지 `999`

## Figma 파일 구성 제안

### Page
- `20 Hospital`

### Section
- `Hospital / Home`
- `Hospital / New Request`
- `Hospital / Request Detail`
- `Hospital / Components`

### Frame 규격
- Mobile base: `390 x 844`
- Desktop expansion sample: `1440 x 1024`

## 화면 1. Hospital Home

### Frame 이름
- `Hospital/Home/Default`

### 목적
- 병원 사용자가 앱에 들어오자마자 해야 할 행동을 결정하게 한다.

### 레이아웃
- 상단 Safe Header
  - 병원명
  - 담당자 인사 문구
  - 작은 상태 배지 또는 프로필 원형 아이콘
- Hero Action Card
  - 제목: `지금 필요한 작업`
  - 본문: 최종 확인이 필요한 요청 또는 최근 생성 요청 요약
  - 우측 또는 하단 CTA: `바로 확인`
- KPI 2x2 Grid
  - 진행 중 요청
  - 오늘 수거 예정
  - 최종 확인 대기
  - 이번 달 누적 정산
- Large Primary CTA
  - `신규 요청 등록`
- Recent Request List
  - 최근 변경된 요청 3건
  - 카드마다 `요청일`, `상태`, `정산 여부`, `상세 보기`

### 시각 포인트
- 첫 진입 시 가장 큰 요소는 `지금 필요한 작업` 카드
- KPI는 숫자를 보여주되 관리자처럼 무겁게 보이지 않게 함
- CTA 버튼은 전체 폭 사용

### 추천 컴포넌트
- `Hospital/PageHeader`
- `Hospital/ActionHeroCard`
- `Hospital/KpiCard`
- `Hospital/RequestCard`
- `Hospital/StickyPrimaryAction`

## 화면 2. New Request

### Frame 이름
- `Hospital/NewRequest/StepForm`

### 목적
- 병원에서 세탁 요청을 빠르고 정확하게 등록하게 한다.

### 구조
- 상단 Header
  - 뒤로가기
  - 제목 `수거 요청 등록`
  - 보조 텍스트 `필요한 품목과 수량을 입력하세요`
- Progress Stepper
  - `1 일정`
  - `2 품목`
  - `3 특이사항`
  - `4 확인`
- 병원 정보 카드
  - 병원명
  - 요청 담당자
- 일정 카드
  - 요청일 선택
  - 선호 시간 선택
- 품목 반복 카드 리스트
  - 품목명
  - 단가/단위
  - 큰 수량 스텝퍼
  - 빠른 증가 칩 `+10`, `+20`, `+50`
- 특이사항 체크 카드
  - 오염물 포함
  - 누수 주의
  - 이중 포장
  - 라벨 부착
- 메모 카드
  - 기사 전달사항
- 하단 고정 요약 바
  - 총 품목 수
  - 총 요청 수량
  - CTA `요청 제출`

### 시각 포인트
- 긴 폼이 아니라 카드 여러 장을 아래로 쌓는 구조
- 수량 입력은 표가 아니라 터치 친화적인 큰 카드
- 마지막 CTA는 항상 화면 하단에서 볼 수 있어야 함

### 추천 컴포넌트
- `Hospital/PageHeader`
- `Hospital/StepIndicator`
- `Hospital/RequestItemCard`
- `Hospital/FlagSelectionCard`
- `Hospital/RequestSummaryBar`

## 화면 3. Request Detail / Final Confirm

### Frame 이름
- `Hospital/RequestDetail/ReadyToConfirm`

### 목적
- 병원 사용자가 납품 결과와 정산 금액을 검토하고 최종 확인하게 한다.

### 구조
- 상단 Header
  - 뒤로가기
  - 제목 `요청 상세`
- Summary Card
  - 요청 ID 축약
  - 요청일
  - 상태 배지
  - 총 정산 금액
- Confirm Notice Card
  - 상태가 `납품완료`일 때만 노출
  - 짧은 안내 문구
  - 확인 이후 수정 불가 경고
- Settlement Item List
  - 품목명
  - 단가
  - 최종 수량
  - 소계
- Total Amount Card
  - `최종 정산 합계`
- Timeline Card
  - 제출
  - 수거 완료
  - 공장 처리
  - 납품 완료
  - 병원 확인 완료
- Feedback Card
  - 피드백 입력
- 하단 고정 CTA
  - 기본: `목록으로`
  - 강조: `최종 납품 확인`

### 시각 포인트
- 시선 흐름이 `정산 금액 -> 품목 내역 -> 확인 버튼` 순으로 이어져야 함
- 확인 카드와 CTA는 분명하지만 과도하게 위협적이지 않게
- 타임라인은 요약형으로 간결하게

### 추천 컴포넌트
- `Hospital/SettlementCard`
- `Hospital/ConfirmPanel`
- `Hospital/TimelineCard`
- `Hospital/StickyPrimaryAction`

## 병원 전용 컴포넌트 제안

### `Hospital/ActionHeroCard`
- Variant:
  - `needs-confirm`
  - `recent-request`
  - `empty`

### `Hospital/KpiCard`
- Variant:
  - `primary`
  - `neutral`
  - `warning`
  - `success`

### `Hospital/RequestCard`
- Variant:
  - `ongoing`
  - `delivery-complete`
  - `done`

### `Hospital/RequestItemCard`
- Props:
  - 품목명
  - 단가
  - 단위
  - 수량
  - 빠른 증가 버튼

### `Hospital/ConfirmPanel`
- Variant:
  - `ready-to-confirm`
  - `confirmed`
  - `read-only`

## 실제 Figma에서 그릴 때의 배치 가이드

### Mobile spacing
- 좌우 패딩 `16`
- 주요 카드 간격 `16`
- 섹션 간격 `24`
- sticky bar 높이 `88~96`

### Typography
- Page Title `24 / 700`
- Card Title `18 / 800`
- KPI Number `28 / 900`
- Section Label `11 / 800 / uppercase`
- Body `14 / 500`

### 아이콘 사용
- 홈: `Package`, `Clock`, `AlertCircle`, `CreditCard`
- 신규 요청: `Calendar`, `Plus`, `Minus`, `Info`
- 상세: `History`, `MessageSquare`, `CheckCircle`

## 코드 반영 우선순위

### 1차
- `src/app/hospital/page.tsx`
- `src/app/hospital/new/page.tsx`

### 2차
- `src/app/hospital/requests/[id]/page.tsx`

### 3차
- `src/app/hospital/requests/page.tsx`

## 구현 시 바로 추출할 컴포넌트
- `HospitalActionHeroCard`
- `HospitalKpiCard`
- `HospitalRequestItemCard`
- `HospitalSettlementSummaryCard`
- `HospitalConfirmPanel`
- `HospitalStickyPrimaryAction`

## 제안 결론
- 병원 역할 디자인은 `신규 요청`과 `최종 확인` 흐름을 가장 짧고 분명하게 만드는 데 집중해야 한다.
- 첫 Figma 시안은 `Hospital Home`, `New Request`, `Request Detail` 3개 프레임으로 시작하는 것이 가장 효율적이다.
- 이후 이 구조를 기준으로 병원 코드 화면을 공통 컴포넌트 단위로 정리하면 구현 속도와 일관성이 동시에 좋아진다.
