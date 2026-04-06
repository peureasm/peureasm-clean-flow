# **App Name**: Clean-flow

## Core Features:

- 병원 세탁 요청 등록: 병원 담당자가 세탁물 종류와 수량을 수동으로 입력하여 수거 요청을 등록하고, 특이사항 메모와 사진을 첨부합니다. 최소 1개 품목 이상 수량 입력 후 제출 가능하며, 오염/누수/이중포장/표시 여부를 체크합니다.
- 기사 수거 현장 확인: 수거 기사가 병원 입력값을 참조하여 실제 수거 수량을 다시 입력하고, 시스템이 자동으로 품목별 차이(Δ)를 계산합니다. 차이 발생 시 필수적으로 사진 첨부와 사유 선택을 통해 분쟁 가능성을 줄입니다.
- 세탁 공정 관리 칸반: 공장 작업자가 입고된 세탁물을 '입고 대기', '입고 완료', '세탁중', '건조중', '포장중', '포장 완료', '출고 대기' 등의 상태로 칸반 보드를 통해 시각적으로 관리합니다.
- 납품 및 병원 수령 확인: 기사가 납품 완료 처리하고, 병원 담당자가 수령을 최종 확인하는 과정을 통해 서비스의 마지막 단계를 기록하고 추적합니다.
- AI 기반 분쟁 조율 지원 도구: 차이 발생 사유, 첨부된 사진, 및 과거 이력 데이터를 분석하여 관리자에게 가장 적절한 분쟁 해결 절차나 커뮤니케이션 스크립트를 도구 형태로 제안함으로써 신속한 문제 해결을 돕습니다.
- 통합 관리자 대시보드: 관리자가 시스템의 전반적인 운영 현황을 한눈에 파악할 수 있는 대시보드를 제공합니다. 오늘 수거/납품 건수, 차이 발생 건수, 미납품 건수, 차이 발생률 그래프, 최근 요청 목록, 차이 발생 큐 위젯 등을 포함합니다.
- 월별 정산 및 통계: 병원별 월 정산 내역을 자동으로 집계합니다. 품목별 수량 합계와 단가 기반으로 총 금액을 계산하며, 정산 상태(집계중/확정/청구/수금완료)를 관리하고 필터링/검색 기능을 제공합니다.

## Style Guidelines:

- Primary color: '#336699' (Professional, calming blue representing trust and efficiency).
- Background color: '#F2F5F8' (Extremely light blue-gray for a clean, unobtrusive canvas, complementing the primary blue).
- Accent color: '#3DC2D8' (Vibrant, clear cyan to highlight important actions and information, creating a sophisticated contrast).
- Warning and emphasis colors: Use '#FF8C00' (Orange) for warnings and minor discrepancies, and '#DC3545' (Red) for critical issues and high-impact alerts like unconfirmed deliveries or significant quantity differences.
- Font: 'Inter' (sans-serif) for both headlines and body text, ensuring excellent readability, neutrality, and legibility for numbers and data in a professional setting.
- Utilize modern, clean, and functional icon sets. Icons should be clear and convey meaning efficiently without excessive ornamentation, aligning with a practical and high-end SaaS dashboard aesthetic.
- Mobile screens will feature a card-based input structure for intuitive, one-hand operation. Administrator web screens will adopt a desktop-first design with a left sidebar for navigation and a prominent top-level KPI summary section for quick oversight.
- Subtle, smooth transition animations will be used for navigation, status updates, and interactive elements to provide a polished user experience without distracting from the functional aspects.