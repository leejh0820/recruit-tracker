# Changelog

---

## v0.3.0 — 2026-03-06

### 추가
- **진행 상태 6단계 시스템** — 관심 / 지원 완료 / 서류 통과 / 1차 면접 / 합격 / 불합격
- 팝업 이력 테이블에 컬러 상태 드롭다운 (행마다 즉시 변경 가능)
- 폼 "지원 여부" → "진행 상태" select로 교체
- Google Sheets H열 "진행 상태" 컬럼 추가 (조건부 색상 적용)
- 기존 데이터 자동 마이그레이션: `applied: true` → "지원 완료", `false` → "관심"
- Apps Script `migrateStatusColumnIfNeeded()` 함수 추가 (기존 시트 일괄 업데이트)

### 수정
- background.js: `TOGGLE_APPLIED` → `SET_STATUS` 메시지 핸들러로 교체
- CSV 헤더에 `status` 컬럼 추가
- Apps Script URL 업데이트

---

## v0.2.0 — 2026-03-03

### 추가
- **연봉/페이** 필드 자동 추출 및 수동 입력 지원
- **지원 여부** 토글 버튼 (미지원 / 지원완료)
- **삭제** 버튼 (이력 행별 삭제)
- **중복 방지**: 같은 URL 재저장 시 기존 항목 업데이트
- 원티드(wanted.co.kr), 사람인(saramin.co.kr) 파싱 지원 추가
- Google Sheets 연동: `salary`, `applied` 컬럼 추가
- Google Sheets 자동 포맷: 네이비 헤더, 열 너비, 1행 고정, 지원여부 조건부 색상
- 날짜 포맷 `2026-03-03T...` → `2026-03-03`으로 단순화

### 수정
- **치명적 버그 수정**: `sendToGoogleSheet().finally()` — Promise 아닌 함수에 `.finally()` 호출로 저장 불가 문제
- Service Worker(MV3) 환경에서 `XMLHttpRequest` → `fetch()`로 교체
- Remember 앱 description 정제:
  - 상단 네비게이션("채용공고 커넥트 프로필...") 제거
  - 하단 푸터("공고 목록 보기", "이 공고와 비슷한" 등) 제거
  - 합격 보상금 문구 제거
- 연봉 파싱 개선: "합격 보상금 50만원" 등 보상금 오매칭 방지
- description 글자 수 제한 제거 (전체 직무설명 보존)
- Google Sheets `getSheetByName("Sheet1")` → `getActiveSheet()` (한국어 환경 대응)

---

## v0.1.0 — 2026-03-03

### 최초 구현
- Chrome 확장 프로그램 (Manifest V3) 기본 구조
- LinkedIn, Remember 앱 파싱 지원
- Chrome `storage.local` 저장
- CSV 복사 기능
- Google Sheets 웹훅 연동 기본 구조
