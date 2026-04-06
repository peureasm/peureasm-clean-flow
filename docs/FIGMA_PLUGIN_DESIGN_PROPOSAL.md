# Figma Plugin Design Proposal

## 목적
- 현재 코드베이스와 역할별 Figma 스펙을 기준으로, 바로 시안 제작에 들어갈 수 있는 디자인 방향을 정리한다.
- `Inspect a Figma design and implement it in code` 워크플로를 이 프로젝트에 맞게 적용할 시작점을 제안한다.
- 어떤 화면부터 Figma로 설계하고 코드에 연결해야 효과가 큰지 우선순위를 제시한다.

## 현재 코드베이스 기준 시각 언어

### 디자인 톤
- 운영형 B2B 제품에 맞는 높은 가독성
- 큰 수치, 짧은 설명, 빠른 상태 인지
- 카드 중심 구조와 명확한 CTA
- 역할별 목적이 바로 드러나는 첫 화면

### 현재 토큰 기준 핵심 색상
- Primary: `#3151E5`
- Secondary: `#035690`
- Accent: `#DFE9FF`
- Background: `#F2F4F7`
- Border: `#DDE1E8`
- Warning 성격 강조: `chart-3` 오렌지 계열

### 공통 레이아웃 제안
- 관리자: 좌측 고정 사이드바 + 넓은 본문 + 우측 보조 패널
- 병원: 모바일 우선 카드 레이아웃, 데스크톱에서 1~2열 확장
- 기사: 375~430 폭 기준 단일 주액션 중심 모바일
- 공장: 수량과 단계가 먼저 보이는 현장형 보드/리스트

## 공통 디자인 제안

### 1. 컴포넌트 우선 전략
- 화면 전체를 먼저 그리기보다 `01 Components`를 먼저 만든다.
- 우선 제작 대상:
  - `UI/Button/*`
  - `UI/Badge/Status`
  - `Admin/Card/KPI`
  - `Hospital/Form/RequestItemCard`
  - `Driver/Card/TaskHero`
  - `Factory/Row/QuantityCompare`

### 2. 공통 화면 패턴
- 목록형 화면: `헤더 -> KPI 또는 요약 -> 필터 -> 액션 가능한 리스트`
- 상세형 화면: `상단 요약 -> 핵심 수치 -> 체크포인트/비교 -> 주액션`
- 모바일 작업형 화면: `현재 상태 -> 지금 해야 할 일 -> 하단 고정 CTA`

### 3. 역할별 시각 차별화
- `ADMIN`: 정제된 운영 대시보드, 정보 밀도 높음
- `HOSPITAL`: 친절한 문장형 UI, CTA 크고 단순함
- `DRIVER`: 손가락 조작 중심, 한 화면 한 행동
- `FACTORY`: 수량 비교와 단계 이동이 가장 먼저 보임

## 역할별 제안

### ADMIN
- 핵심 방향: 운영 큐 중심 대시보드
- 추천 첫 시안:
  - `Dashboard`
  - `Requests List`
  - `Request Detail`
- 화면 톤:
  - KPI는 4개 1세트
  - 우선 처리 큐는 큰 카드 또는 리스트 블록
  - 상세는 `요약 + 체크포인트 + 탭` 템플릿 통일
- 코드 연결 시작점:
  - `src/app/admin/page.tsx`
  - `src/app/admin/requests/page.tsx`
  - `src/app/admin/requests/[id]/page.tsx`

### HOSPITAL
- 핵심 방향: 요청 생성과 최종 확인을 가장 짧게
- 추천 첫 시안:
  - `Hospital Dashboard`
  - `New Request`
  - `Request Detail / Final Confirm`
- 화면 톤:
  - 긴 폼 대신 카드 묶음형 단계 UI
  - 정산 금액과 상태를 상단에 고정
  - 주액션은 항상 1개만 크게
- 코드 연결 시작점:
  - `src/app/hospital/page.tsx`
  - `src/app/hospital/new/page.tsx`
  - `src/app/hospital/requests/[id]/page.tsx`

### DRIVER
- 핵심 방향: 현장 작업 속도와 실수 방지
- 추천 첫 시안:
  - `Driver Home`
  - `Collection Flow`
  - `Delivery Flow`
- 화면 톤:
  - 오늘 할 일 1건을 hero card로 크게 노출
  - 품목 입력은 표 대신 반복 카드
  - CTA는 하단 고정 영역으로 일관화
- 코드 연결 시작점:
  - `src/app/driver/page.tsx`
  - `src/app/driver/collection/[id]/page.tsx`
  - `src/app/driver/delivery/[id]/page.tsx`

### FACTORY
- 핵심 방향: 단계 흐름과 수량 차이 즉시 인지
- 추천 첫 시안:
  - `Factory Home`
  - `Inbound List`
  - `Inbound Detail`
- 화면 톤:
  - 현장형 보드와 카드형 비교 UI
  - 차이 발생 행은 아이콘과 색으로 즉시 구분
  - 다음 단계 이동 버튼을 가장 크게
- 코드 연결 시작점:
  - `src/app/factory/page.tsx`
  - `src/app/factory/inbound/page.tsx`
  - `src/app/factory/inbound/[id]/page.tsx`

## 가장 먼저 만들 화면 우선순위

### 1순위: DRIVER 수거/납품 화면
- 이유: 현장 효율 개선 효과가 가장 크다.
- Figma 컴포넌트로 분리하기 좋다.
- 카드 반복형과 sticky CTA 패턴이 명확하다.

### 2순위: HOSPITAL 신규 요청 + 최종 확인
- 이유: 병원 사용자의 핵심 행동이 집중된 구간이다.
- 단계형 폼과 정산 확인 패턴을 빠르게 표준화할 수 있다.

### 3순위: ADMIN 요청 목록 + 상세
- 이유: 운영자가 전체 흐름을 가장 자주 보는 화면이다.
- KPI, 필터 칩, 우측 보조 패널 등 재사용 가능한 패턴이 많다.

### 4순위: FACTORY 입고 상세
- 이유: 기사 수량과 공장 수량 비교라는 중요한 템플릿이 있다.
- 이후 출고 상세로 쉽게 확장된다.

## Figma 파일 구조 제안

### Page 구성
- `00 Foundations`
- `01 Components`
- `10 Admin`
- `20 Hospital`
- `30 Driver`
- `40 Factory`

### 반드시 먼저 컴포넌트화할 항목
- Status Badge
- KPI Card
- Page Header
- Action Hero Card
- Quantity Compare Row
- Sticky Action Bar

## 이 프로젝트에서의 Figma Inspect-to-Code 적용 방식

### 시작 조건
- 아래 둘 중 하나가 필요하다.
  - Figma URL: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
  - Figma 데스크톱 앱에서 구현할 노드 선택

### 실제 구현 순서
1. 노드 URL 또는 선택된 노드 확보
2. Figma design context 조회
3. Figma screenshot 조회
4. 기존 컴포넌트와 매핑
5. 라우트 또는 템플릿 컴포넌트에 반영
6. Figma와 코드 시각 비교 검증

### 이 저장소에서 우선 매핑할 코드 컴포넌트
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/card.tsx`
- `src/components/shared/StatusBadge.tsx`
- `src/components/shared/AddressSearchField.tsx`

## 지금 바로 추천하는 다음 단계

### 옵션 A
- 기사 수거 화면 한 장을 먼저 Figma로 설계
- 이후 `src/app/driver/collection/[id]/page.tsx`에 1차 반영

### 옵션 B
- 병원 신규 요청 화면을 먼저 설계
- 이후 `src/app/hospital/new/page.tsx`를 단계형 카드 UI로 정리

### 옵션 C
- 관리자 요청 목록을 먼저 설계
- 이후 KPI, 필터 칩, 요청 행을 공통 템플릿으로 추출

## 현재 확인된 상태
- Figma 계정 연결 확인: `peureasm@gmail.com`
- 현재 이 저장소에는 역할별 화면 스펙과 Code Connect 매핑 문서가 이미 잘 정리되어 있다.
- 아직 실제 inspect 대상 Figma URL 또는 선택 노드는 전달되지 않았으므로, 이번 단계에서는 설계 방향과 적용 순서까지 제안한다.

## 결론
- 이 프로젝트는 공통 UI를 먼저 정리한 뒤 역할별 핵심 화면을 점진적으로 Figma와 코드에 연결하는 방식이 가장 효율적이다.
- 첫 구현 대상으로는 `DRIVER 수거 화면`, `HOSPITAL 신규 요청`, `ADMIN 요청 목록` 순서를 권장한다.
- Figma URL이나 선택 노드를 주면 다음 단계에서 바로 inspect를 실행하고 실제 코드 구현까지 이어갈 수 있다.
