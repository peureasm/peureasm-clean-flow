# Figma Code Connect Mapping

## 목적
- 피그마 컴포넌트와 현재 코드 컴포넌트를 Code Connect 기준으로 연결하기 위한 매핑표를 제공한다.
- 디자이너와 개발자가 동일한 이름 체계로 작업하도록 돕는다.
- 어떤 컴포넌트부터 연결해야 실제 화면 반영 효과가 큰지 우선순위를 제시한다.

## 전제
- 프레임워크: React
- 언어: TypeScript
- 스타일링: Tailwind CSS + shadcn/ui + CSS Variables
- 공통 컴포넌트 경로:
  - `src/components/ui/*`
  - `src/components/shared/*`

## 네이밍 규칙

### 피그마 컴포넌트 이름 규칙
- 공통 UI: `UI/<Category>/<Name>`
- 관리자 템플릿: `Admin/<Category>/<Name>`
- 병원 템플릿: `Hospital/<Category>/<Name>`
- 기사 템플릿: `Driver/<Category>/<Name>`
- 공장 템플릿: `Factory/<Category>/<Name>`

예시:
- `UI/Button/Primary`
- `UI/Badge/Status`
- `Admin/Card/KPI`
- `Admin/Layout/DetailTemplate`
- `Driver/Card/TaskHero`

### 코드 연결 규칙
- 가능한 한 공통 컴포넌트는 `src/components/ui` 또는 `src/components/shared`에 연결한다.
- 페이지 전용 레이아웃은 개별 라우트 파일이 아니라 이후 추출될 템플릿 컴포넌트와 연결하는 것이 이상적이다.
- 지금 당장은 페이지 수준 매핑도 허용하되, 장기적으로는 템플릿 컴포넌트 추출을 권장한다.

## 1. 공통 UI 컴포넌트 매핑

| Figma Component | Code Component | File Path | 역할 | 우선순위 |
|---|---|---|---|---|
| `UI/Button/Primary` | `Button` | `src/components/ui/button.tsx` | 전체 공통 | 높음 |
| `UI/Button/Outline` | `Button` | `src/components/ui/button.tsx` | 전체 공통 | 높음 |
| `UI/Button/Ghost` | `Button` | `src/components/ui/button.tsx` | 전체 공통 | 높음 |
| `UI/Input/Text` | `Input` | `src/components/ui/input.tsx` | 전체 공통 | 높음 |
| `UI/Input/Textarea` | `Textarea` | `src/components/ui/textarea.tsx` | 전체 공통 | 중간 |
| `UI/Select/Default` | `Select` | `src/components/ui/select.tsx` | 규격값 선택 | 높음 |
| `UI/Badge/Default` | `Badge` | `src/components/ui/badge.tsx` | 전체 공통 | 높음 |
| `UI/Badge/Status` | `StatusBadge` | `src/components/shared/StatusBadge.tsx` | 상태 표시 | 매우 높음 |
| `UI/Card/Base` | `Card` | `src/components/ui/card.tsx` | 전체 공통 | 높음 |
| `UI/Table/Base` | `Table` | `src/components/ui/table.tsx` | 관리자/공장 | 높음 |
| `UI/Tabs/Base` | `Tabs` | `src/components/ui/tabs.tsx` | 상세 화면 | 높음 |
| `UI/Dialog/Base` | `Dialog` | `src/components/ui/dialog.tsx` | 등록/공유/수정 | 높음 |
| `UI/Dialog/Alert` | `AlertDialog` | `src/components/ui/alert-dialog.tsx` | 확인/삭제 | 높음 |
| `UI/Pagination/Base` | `Pagination` | `src/components/shared/Pagination.tsx` | 목록 화면 | 중간 |
| `UI/Input/AddressSearch` | `AddressSearchField` | `src/components/shared/AddressSearchField.tsx` | 주소 검색형 입력 | 높음 |
| `UI/Checkbox/Base` | `Checkbox` | `src/components/ui/checkbox.tsx` | 품목/선택 리스트 | 중간 |
| `UI/Sidebar/Admin` | `Sidebar` 계열 | `src/components/ui/sidebar.tsx` | 관리자 셸 | 중간 |

## 2. 관리자 전용 템플릿 매핑

| Figma Component | 현재 코드 기준 연결 위치 | 권장 추출 컴포넌트명 | 우선 적용 화면 | 우선순위 |
|---|---|---|---|---|
| `Admin/Layout/PageHeader` | `src/app/admin/requests/page.tsx` 등 각 페이지 헤더 | `AdminPageHeader` | 모든 관리자 화면 | 매우 높음 |
| `Admin/Card/KPI` | `src/app/admin/requests/page.tsx` | `AdminKpiCard` | 요청 목록 | 매우 높음 |
| `Admin/Card/Checklist` | `src/app/admin/hospitals/[id]/page.tsx` | `AdminChecklistCard` | 병원 상세 | 높음 |
| `Admin/Card/Checklist` | `src/app/admin/drivers/[id]/page.tsx` | `AdminChecklistCard` | 기사 상세 | 높음 |
| `Admin/Layout/DetailTemplate` | `src/app/admin/hospitals/[id]/page.tsx` | `AdminDetailTemplate` | 병원 상세 | 매우 높음 |
| `Admin/Layout/DetailTemplate` | `src/app/admin/drivers/[id]/page.tsx` | `AdminDetailTemplate` | 기사 상세 | 매우 높음 |
| `Admin/Filter/ChipGroup` | `src/app/admin/requests/page.tsx` | `AdminFilterChips` | 요청 목록 | 높음 |
| `Admin/Panel/RightInfo` | `src/app/admin/requests/page.tsx` | `AdminRightInfoPanel` | 요청 목록 | 높음 |
| `Admin/Table/RequestRow` | `src/app/admin/requests/page.tsx` | `AdminRequestRow` | 요청 목록 | 높음 |
| `Admin/Table/UserRow` | `src/app/admin/users/page.tsx` | `AdminUserRow` | 사용자/권한 | 중간 |
| `Admin/Card/HospitalCard` | `src/app/admin/users/panels/AdminHospitalsPanel.tsx` | `AdminHospitalCard` | 병원 목록 | 높음 |
| `Admin/Card/DriverCard` | `src/app/admin/users/panels/AdminDriversPanel.tsx` | `AdminDriverCard` | 기사 목록 | 높음 |

## 3. 병원 역할 템플릿 매핑

| Figma Component | 현재 코드 기준 연결 위치 | 권장 추출 컴포넌트명 | 우선 적용 화면 | 우선순위 |
|---|---|---|---|---|
| `Hospital/Layout/PageHeader` | `src/app/hospital/page.tsx` | `HospitalPageHeader` | 병원 홈 | 높음 |
| `Hospital/Card/KPI` | `src/app/hospital/page.tsx` | `HospitalKpiCard` | 병원 홈 | 높음 |
| `Hospital/Card/ActionHero` | `src/app/hospital/page.tsx` | `HospitalActionHeroCard` | 병원 홈 | 높음 |
| `Hospital/Form/RequestItemCard` | `src/app/hospital/new/page.tsx` | `HospitalRequestItemCard` | 신규 요청 | 매우 높음 |
| `Hospital/Card/SettlementSummary` | `src/app/hospital/requests/[id]/page.tsx` | `HospitalSettlementSummaryCard` | 요청 상세 | 매우 높음 |
| `Hospital/Card/ConfirmPanel` | `src/app/hospital/requests/[id]/page.tsx` | `HospitalConfirmPanel` | 요청 상세 | 매우 높음 |
| `Hospital/Card/Timeline` | `src/app/hospital/requests/[id]/page.tsx` | `HospitalTimelineCard` | 요청 상세 | 중간 |

## 4. 기사 역할 템플릿 매핑

| Figma Component | 현재 코드 기준 연결 위치 | 권장 추출 컴포넌트명 | 우선 적용 화면 | 우선순위 |
|---|---|---|---|---|
| `Driver/Layout/MobileHeader` | `src/app/driver/*` 계열 | `DriverMobileHeader` | 기사 전체 모바일 | 매우 높음 |
| `Driver/Card/KpiMini` | `src/app/driver/page.tsx` | `DriverKpiMini` | 기사 홈 | 높음 |
| `Driver/Card/TaskHero` | `src/app/driver/page.tsx` | `DriverTaskHeroCard` | 기사 홈 | 매우 높음 |
| `Driver/Card/Hospital` | `src/app/driver/hospitals/page.tsx` | `DriverHospitalCard` | 담당 병원 목록 | 높음 |
| `Driver/Card/QuantityInput` | `src/app/driver/collection/[id]/page.tsx` | `DriverQuantityInputCard` | 수거 처리 | 매우 높음 |
| `Driver/Card/QuantityInput` | `src/app/driver/delivery/[id]/page.tsx` | `DriverQuantityInputCard` | 납품 처리 | 매우 높음 |
| `Driver/Bar/StickyAction` | `src/app/driver/collection/[id]/page.tsx` | `DriverStickyActionBar` | 수거 처리 | 높음 |
| `Driver/Bar/StickyAction` | `src/app/driver/delivery/[id]/page.tsx` | `DriverStickyActionBar` | 납품 처리 | 높음 |

## 5. 공장 역할 템플릿 매핑

| Figma Component | 현재 코드 기준 연결 위치 | 권장 추출 컴포넌트명 | 우선 적용 화면 | 우선순위 |
|---|---|---|---|---|
| `Factory/Layout/PageHeader` | `src/app/factory/page.tsx` | `FactoryPageHeader` | 공장 홈 | 높음 |
| `Factory/Card/KPI` | `src/app/factory/page.tsx` | `FactoryKpiCard` | 공장 홈 | 높음 |
| `Factory/Card/Queue` | `src/app/factory/inbound/page.tsx` | `FactoryQueueCard` | 입고 목록 | 높음 |
| `Factory/Card/Queue` | `src/app/factory/outbound/page.tsx` | `FactoryQueueCard` | 출고 목록 | 높음 |
| `Factory/Row/QuantityCompare` | `src/app/factory/inbound/[id]/page.tsx` | `FactoryQuantityCompareRow` | 입고 상세 | 매우 높음 |
| `Factory/Row/QuantityCompare` | `src/app/factory/outbound/[id]/page.tsx` | `FactoryQuantityCompareRow` | 출고 상세 | 매우 높음 |
| `Factory/Card/ExceptionSummary` | `src/app/factory/inbound/[id]/page.tsx` | `FactoryExceptionSummaryCard` | 입고 상세 | 높음 |
| `Factory/Bar/StickyAction` | `src/app/factory/inbound/[id]/page.tsx` | `FactoryStickyActionBar` | 입고 상세 | 높음 |
| `Factory/Bar/StickyAction` | `src/app/factory/outbound/[id]/page.tsx` | `FactoryStickyActionBar` | 출고 상세 | 높음 |

## 6. 우선 연결 순서

### 1차 우선순위
- `UI/Button/*`
- `UI/Input/Text`
- `UI/Select/Default`
- `UI/Badge/Status`
- `Admin/Card/KPI`
- `Admin/Layout/DetailTemplate`
- `Hospital/Form/RequestItemCard`
- `Driver/Card/TaskHero`
- `Factory/Row/QuantityCompare`

### 2차 우선순위
- `UI/Dialog/Base`
- `UI/Dialog/Alert`
- `UI/Table/Base`
- `Admin/Card/HospitalCard`
- `Admin/Card/DriverCard`
- `Hospital/Card/ConfirmPanel`
- `Driver/Bar/StickyAction`
- `Factory/Card/Queue`

### 3차 우선순위
- `UI/Pagination/Base`
- `UI/Sidebar/Admin`
- `Hospital/Card/Timeline`
- `Factory/Card/ExceptionSummary`

## 7. 화면별 Code Connect 시작점

| 화면 | 먼저 연결할 피그마 컴포넌트 | 이유 |
|---|---|---|
| 관리자 요청 목록 | `Admin/Card/KPI`, `Admin/Filter/ChipGroup`, `Admin/Table/RequestRow` | 정산 통합 화면이라 영향 범위가 큼 |
| 병원 상세 | `Admin/Layout/DetailTemplate`, `Admin/Card/Checklist` | 상세 패턴 표준화 핵심 |
| 기사 상세 | `Admin/Layout/DetailTemplate`, `Admin/Card/Checklist` | 병원 상세와 템플릿 공유 가능 |
| 병원 요청 상세 | `Hospital/Card/SettlementSummary`, `Hospital/Card/ConfirmPanel` | 병원 역할 핵심 액션 화면 |
| 기사 수거/납품 | `Driver/Card/QuantityInput`, `Driver/Bar/StickyAction` | 현장 효율 개선 효과 큼 |
| 공장 입고 상세 | `Factory/Row/QuantityCompare`, `Factory/Card/ExceptionSummary` | 공정 정확도와 직결 |

## 8. 피그마 측 컴포넌트 속성 제안

### Button
- Variant: `primary`, `outline`, `ghost`, `destructive`
- Size: `default`, `sm`, `lg`, `icon`
- Icon: `none`, `leading`, `only`

### Status Badge
- Status:
  - `draft`
  - `submitted`
  - `collected`
  - `inbound`
  - `washing`
  - `drying`
  - `packing`
  - `outbound`
  - `delivered`
  - `confirmed`
  - `closed`

### KPI Card
- Tone: `primary`, `info`, `warning`, `success`, `neutral`
- With subtext: `true/false`

### Detail Template
- Left panel: `profile`, `hospital`, `driver`
- Right tabs count: `2`, `3`, `4`

## 9. Code Connect 적용 예시

### 공통 버튼
- Figma: `UI/Button/Primary`
- Code: `src/components/ui/button.tsx`
- Label: `React`

### 상태 배지
- Figma: `UI/Badge/Status`
- Code: `src/components/shared/StatusBadge.tsx`
- Label: `React`

### 주소 검색 입력
- Figma: `UI/Input/AddressSearch`
- Code: `src/components/shared/AddressSearchField.tsx`
- Label: `React`

## 10. 실무 적용 순서
1. 피그마에서 공통 UI 컴포넌트 이름을 이 문서 기준으로 정리
2. 관리자 요청 목록과 병원 상세에 쓰이는 공통 템플릿부터 피그마 컴포넌트화
3. Code Connect는 공통 UI -> 관리자 템플릿 -> 역할별 작업 컴포넌트 순으로 연결
4. 코드 반영은 템플릿 추출이 필요한 곳부터 점진적으로 진행

## 11. 권장 결론
- Code Connect는 모든 화면을 한 번에 연결하기보다, 공통 UI와 재사용률 높은 상세 템플릿부터 시작해야 효율이 높다.
- 이 프로젝트에서는 `Admin Detail Template`, `StatusBadge`, `Button`, `Select`, `AddressSearchField`가 가장 중요한 1차 연결 대상이다.
