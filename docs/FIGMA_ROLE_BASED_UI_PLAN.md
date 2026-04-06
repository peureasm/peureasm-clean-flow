# Figma Role-Based UI Plan

## 목표
- 현재 Next.js 코드베이스를 기준으로 `ADMIN`, `HOSPITAL`, `DRIVER`, `FACTORY` 역할별 최적 UI를 정의한다.
- 피그마에서 먼저 역할별 템플릿과 공통 컴포넌트를 만들고, 이후 코드 컴포넌트와 매핑해 점진적으로 반영한다.
- 메뉴 수를 줄이고, 각 역할이 가장 자주 하는 업무를 첫 화면에서 바로 처리할 수 있게 한다.

## 코드베이스 기준 현황

### 프레임워크
- App Router 기반 Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- Lucide 아이콘

### 디자인 토큰 위치
- `tailwind.config.ts`
- `src/app/globals.css`
- 핵심 토큰은 CSS 변수 기반이다.
- 주요 토큰:
  - `--background`
  - `--foreground`
  - `--primary`
  - `--secondary`
  - `--accent`
  - `--muted`
  - `--destructive`
  - `--radius`
  - `--btn-radius`

### 공통 UI 컴포넌트 위치
- `src/components/ui/*`
- `src/components/shared/*`

### 역할별 주요 라우트
- `ADMIN`
  - `src/app/admin/page.tsx`
  - `src/app/admin/requests/page.tsx`
  - `src/app/admin/requests/[id]/page.tsx`
  - `src/app/admin/hospitals/page.tsx`
  - `src/app/admin/hospitals/[id]/page.tsx`
  - `src/app/admin/drivers/page.tsx`
  - `src/app/admin/drivers/[id]/page.tsx`
  - `src/app/admin/users/page.tsx`
  - `src/app/admin/items/page.tsx`
  - `src/app/admin/discrepancies/page.tsx`
  - `src/app/admin/stats/page.tsx`
- `HOSPITAL`
  - `src/app/hospital/page.tsx`
  - `src/app/hospital/new/page.tsx`
  - `src/app/hospital/requests/page.tsx`
  - `src/app/hospital/requests/[id]/page.tsx`
  - `src/app/hospital/settings/page.tsx`
- `DRIVER`
  - `src/app/driver/page.tsx`
  - `src/app/driver/hospitals/page.tsx`
  - `src/app/driver/hospitals/[id]/page.tsx`
  - `src/app/driver/collection/[id]/page.tsx`
  - `src/app/driver/delivery/[id]/page.tsx`
  - `src/app/driver/history/page.tsx`
- `FACTORY`
  - `src/app/factory/page.tsx`
  - `src/app/factory/inbound/page.tsx`
  - `src/app/factory/inbound/[id]/page.tsx`
  - `src/app/factory/outbound/page.tsx`
  - `src/app/factory/outbound/[id]/page.tsx`

## 역할별 UX 원칙

### 1. ADMIN
- 운영 큐 중심
- "무엇이 밀려있는가"가 먼저 보여야 한다.
- 목록보다 `요약 카드 -> 필터 -> 액션 가능한 리스트 -> 상세` 순서가 적합하다.
- 병원 상세와 기사 상세처럼 `운영 요약 + 체크포인트 + 탭형 세부 관리` 패턴을 표준으로 삼는다.

### 2. HOSPITAL
- 요청 생성과 납품 확인 중심
- 복잡한 관리 기능은 최소화한다.
- 상태, 금액, 최종 확인 같은 핵심 행동을 큰 버튼과 명확한 문장으로 노출한다.

### 3. DRIVER
- 모바일 작업 중심
- 오늘 해야 할 일과 다음 액션이 첫 화면에 보여야 한다.
- 지도/병원/수량 확인처럼 현장 실행에 필요한 정보 위주로 단순화한다.

### 4. FACTORY
- 공정 진행과 수량 예외 처리 중심
- 입고/처리/출고 단계가 명확해야 한다.
- 색보다 상태 구조와 경고 우선이다.

## 피그마 파일 구조 제안

### Page 1. `00 Foundations`
- Color tokens
- Typography scale
- Radius
- Shadows
- Spacing rules
- Icon usage rules
- Status color rules

### Page 2. `01 Components`
- Buttons
- Inputs
- Search bars
- Selects
- Chips / Badges
- KPI cards
- Data table row
- List cards
- Detail summary cards
- Empty states
- Dialogs
- Pagination
- Tabs

### Page 3. `10 Admin`
- Dashboard
- Requests list
- Request detail
- Hospitals list
- Hospital detail
- Drivers list
- Driver detail
- Users / permissions
- Discrepancy monitoring

### Page 4. `20 Hospital`
- Dashboard
- New request
- Requests list
- Request detail
- Settings

### Page 5. `30 Driver`
- Today dashboard
- Assigned hospitals
- Hospital detail
- Collection flow
- Delivery flow
- History

### Page 6. `40 Factory`
- Dashboard
- Inbound queue
- Inbound detail
- Outbound queue
- Outbound detail

## 역할별 핵심 화면 목록

### ADMIN 필수 화면
1. 운영 대시보드
2. 전체 요청 내역
3. 요청 상세
4. 병원 목록
5. 병원 상세
6. 기사 목록
7. 기사 상세
8. 사용자/권한 관리
9. 차이 발생 모니터링

### HOSPITAL 필수 화면
1. 병원 홈
2. 신규 요청 등록
3. 요청 목록
4. 요청 상세 및 최종 확인
5. 병원 정보 설정

### DRIVER 필수 화면
1. 오늘 작업 홈
2. 담당 병원 목록
3. 병원별 작업 화면
4. 수거 처리 화면
5. 납품 처리 화면
6. 이력 화면

### FACTORY 필수 화면
1. 공정 홈
2. 입고 대기 목록
3. 입고 상세
4. 출고 대기 목록
5. 출고 상세

## 역할별 정보구조 제안

### ADMIN
- 1뎁스
  - 대시보드
  - 요청 관리
  - 병원 관리
  - 기사 관리
  - 사용자/권한
  - 차이 모니터링
  - 통계
- 요청 관리 내부 탭
  - 전체
  - 진행 중
  - 정산 대기
  - 종결

### HOSPITAL
- 1뎁스
  - 홈
  - 요청 등록
  - 요청 내역
  - 병원 정보

### DRIVER
- 1뎁스
  - 오늘 작업
  - 담당 병원
  - 작업 이력

### FACTORY
- 1뎁스
  - 홈
  - 입고 관리
  - 출고 관리

## 역할별 첫 화면 정의

### ADMIN 첫 화면
- `오늘 처리해야 할 큐`
- 카드:
  - 승인 대기 사용자
  - 미배정 병원
  - 정산 대기 요청
  - 차이 발생 요청

### HOSPITAL 첫 화면
- `내 병원의 현재 요청 현황`
- 카드:
  - 진행 중 요청
  - 오늘 납품 예정
  - 최종 확인 대기
  - 이번 달 누적 정산

### DRIVER 첫 화면
- `오늘 내가 가야 할 병원`
- 카드:
  - 오늘 수거 건수
  - 오늘 납품 건수
  - 첫 방문 병원
  - 미완료 작업 수

### FACTORY 첫 화면
- `현재 공정 병목`
- 카드:
  - 입고 대기
  - 세탁 중
  - 건조 중
  - 출고 대기

## 공통 컴포넌트 매핑

### 이미 있는 코드 컴포넌트와 피그마 매핑 대상
- `src/components/ui/button.tsx`
  - Primary / Secondary / Outline / Destructive 버튼 세트
- `src/components/ui/input.tsx`
  - 일반 입력
- `src/components/ui/select.tsx`
  - 규격값 셀렉트
- `src/components/ui/dialog.tsx`
  - 등록/수정/공유 다이얼로그
- `src/components/ui/alert-dialog.tsx`
  - 확인/삭제/최종확인 다이얼로그
- `src/components/ui/table.tsx`
  - 운영 테이블
- `src/components/ui/tabs.tsx`
  - 상세 탭
- `src/components/shared/Pagination.tsx`
  - 페이지네이션
- `src/components/shared/StatusBadge.tsx`
  - 상태 배지
- `src/components/shared/AddressSearchField.tsx`
  - 주소 찾기형 입력

### 피그마에서 반드시 먼저 컴포넌트화할 것
1. KPI 카드
2. 운영 체크포인트 카드
3. 상세 상단 헤더
4. 목록 필터 바
5. 상태 배지
6. 액션 다이얼로그
7. 2단 상세 레이아웃
8. 모바일 작업 카드

## 화면 템플릿 제안

### Admin Detail Template
- 상단 헤더
  - 제목
  - 코드/ID
  - 설명
  - 주요 액션 버튼
- 상단 KPI 4개
- 좌측
  - 프로필/기본 정보 카드
  - 운영 체크포인트 카드
- 우측
  - 탭형 상세 관리
  - 탭 설명 영역

적용 대상:
- 병원 상세
- 기사 상세
- 요청 상세 일부

### Admin List Template
- 페이지 헤더
- KPI 카드 3~5개
- 필터 칩/검색/날짜
- 리스트 또는 테이블
- 우측 보조 패널 옵션

적용 대상:
- 요청 내역
- 사용자/권한
- 병원 목록
- 기사 목록

### Mobile Task Template
- 상단 오늘 요약
- 주요 작업 카드
- 다음 액션 고정 버튼
- 간단한 타임라인

적용 대상:
- 기사 홈
- 수거/납품 화면
- 병원 요청 확인 화면 일부

## 피그마 작업 순서

### 1단계. Foundations 정리
- `globals.css`와 `tailwind.config.ts` 기반 토큰을 피그마 변수로 변환
- 색상 이름은 코드 변수명과 최대한 비슷하게 맞춘다.

### 2단계. Component Library 구축
- shadcn/ui 기반 공통 컴포넌트를 피그마 컴포넌트 세트로 만든다.
- 버튼, 인풋, 셀렉트, 배지, 탭, 테이블 헤더, 다이얼로그 우선

### 3단계. 역할별 템플릿 제작
- `ADMIN` 상세/리스트 템플릿
- `HOSPITAL` 요청형 템플릿
- `DRIVER` 모바일 템플릿
- `FACTORY` 공정형 템플릿

### 4단계. 실제 화면 연결
- 현재 운영 중요도 순서로 반영
- 추천 우선순위:
  1. Admin requests
  2. Admin hospital detail
  3. Admin driver detail
  4. Driver home / task flow
  5. Hospital request detail
  6. Factory queues

## 피그마 플러그인 활용 권장 방식

### A. 디자인 시스템 규칙 문서
- 피그마 플러그인에서 디자인 시스템 규칙 문서를 생성할 때 아래 기준을 포함한다.
- 디자인 토큰은 CSS 변수와 1:1 대응
- 컴포넌트 이름은 코드 컴포넌트명 기준
- 상태는 배지/컬러/아이콘 규칙까지 함께 정의
- 관리자/병원/기사/공장 템플릿은 variant가 아니라 별도 flows로 분리

### B. Code Connect 매핑
- 피그마 컴포넌트를 아래 코드 위치와 연결한다.
- `Button` -> `src/components/ui/button.tsx`
- `Input` -> `src/components/ui/input.tsx`
- `Select` -> `src/components/ui/select.tsx`
- `Dialog` -> `src/components/ui/dialog.tsx`
- `StatusBadge` -> `src/components/shared/StatusBadge.tsx`
- `AddressSearchField` -> `src/components/shared/AddressSearchField.tsx`

### C. 시안 검증 순서
- 1차: 관리자 요청 통합 화면
- 2차: 병원 상세 / 기사 상세 공통 템플릿 검증
- 3차: 기사 모바일 플로우 검증

## 개발 반영 규칙

### 디자인 반영 시 지켜야 할 것
- 코드 토큰 이름과 피그마 변수 이름을 맞춘다.
- 공통 컴포넌트는 새로 만들기보다 `src/components/ui`를 우선 재사용한다.
- 역할별 차이는 레이아웃과 정보 밀도로 만들고, 기본 색 체계는 유지한다.
- 상태 배지는 새 스타일을 만들기보다 `StatusBadge` 체계를 확장한다.
- 주소, 단위, 권한처럼 표준 데이터는 자유 입력보다 선택형 UI를 우선한다.

### 화면 반영 우선순위
1. 운영 큐에 직접 영향 주는 화면
2. 승인/배정/정산 액션이 있는 상세 화면
3. 현장 작업용 모바일 화면
4. 통계/설정 화면

## 바로 실행할 다음 작업

### 디자이너용
1. `00 Foundations` 페이지 생성
2. `01 Components`에 버튼/배지/탭/KPI 카드 정의
3. `10 Admin`에 `요청 목록`, `병원 상세`, `기사 상세` 시안 제작

### 개발자용
1. `StatusBadge` 한글 상태명 정리
2. `Admin requests` 화면을 디자인 시스템 기준으로 더 컴포넌트화
3. 역할별 템플릿 컴포넌트 추출 여부 검토

### 협업용
1. 피그마 컴포넌트명과 코드 컴포넌트명 매핑표 확정
2. 역할별 핵심 KPI와 첫 화면 목적 문장 확정
3. 상세 화면 공통 템플릿 승인

## 권장 결론
- 이 프로젝트는 `하나의 공통 UI`보다 `공통 디자인 시스템 + 역할별 템플릿`이 최적이다.
- 관리자 화면은 운영 큐 중심, 기사 화면은 모바일 작업 중심으로 완전히 다르게 최적화하는 것이 맞다.
- 피그마에서는 공통 컴포넌트를 먼저 만들고, 역할별 앱 셸을 따로 설계해야 실제 업무 효율이 올라간다.
