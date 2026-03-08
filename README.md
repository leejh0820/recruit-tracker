# Recruit Tracker

LinkedIn, Remember, 원티드, 사람인 등 채용 공고 페이지에서 **자동으로 정보를 추출**하고 Google Sheets에 기록하는 Chrome 확장 프로그램.

## 주요 기능

- 공고 페이지에서 회사명 / 직무 / 위치 / 근무형태 / 연봉 / 직무설명 자동 추출
- **진행 상태 6단계 관리** — 관심 / 지원 완료 / 서류 통과 / 1차 면접 / 합격 / 불합격
- Chrome 로컬 스토리지 저장 + Google Sheets 자동 적재
- CSV 복사로 스프레드시트 붙여넣기 지원
- 같은 URL 재저장 시 업데이트(중복 없음)

## 지원 사이트

| 사이트 | 자동 추출 항목 |
|---|---|
| LinkedIn | 회사명, 위치, 근무형태, 연봉 |
| Remember (career.rememberapp.co.kr) | 회사명, 위치, 근무형태, 연봉, 직무설명(네비/푸터 제거) |
| 원티드 (wanted.co.kr) | 회사명, 위치, 연봉 |
| 사람인 (saramin.co.kr) | 회사명, 위치, 연봉 |
| 기타 사이트 | 직무명, URL, 본문 텍스트 |

## 설치

1. `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** ON
3. **압축해제된 확장 프로그램을 로드** 클릭 → 이 폴더 선택
4. 브라우저 우측 상단에서 **Recruit Tracker** 아이콘 고정(pin)

## 사용 방법

1. 채용 공고 상세 페이지 열기
2. Recruit Tracker 아이콘 클릭
3. **"현재 페이지 정보 가져오기"** 클릭 → 자동 추출
4. 필요 시 직접 수정 → **"저장"**
5. 저장된 이력에서 **진행 상태** 버튼으로 상태 변경
6. **CSV 복사** → Google Sheets에 붙여넣기

## Google Sheets 연동

### 1. Apps Script 설정

구글 시트에서 **확장 프로그램 → Apps Script** 열기 후 아래 코드 입력:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const body = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    setupSheet();
  } else {
    migrateSheetIfNeeded(sheet);
    migrateStatusColumnIfNeeded(sheet);
  }
  const dateStr = (body.capturedAt || new Date().toISOString()).slice(0, 10);
  const desc = body.description || "";
  sheet.appendRow([
    dateStr,
    body.source || "",
    body.company || "",
    body.title || "",
    body.location || "",
    body.workType || "",
    body.salary || "",
    body.status || "관심",
    body.applied ? "TRUE" : "FALSE",
    body.url || "",
    desc
  ]);
  return ContentService.createTextOutput("ok");
}

function migrateSheetIfNeeded(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getRange(1, 2).getValue() === "출처") return;
  sheet.insertColumnBefore(2);
  const cell = sheet.getRange(1, 2);
  cell.setValue("출처");
  cell.setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold")
      .setFontSize(11).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setColumnWidth(2, 90);
  SpreadsheetApp.flush();
}

function migrateStatusColumnIfNeeded(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getRange(1, 8).getValue() === "진행 상태") return;
  sheet.insertColumnBefore(8);
  const cell = sheet.getRange(1, 8);
  cell.setValue("진행 상태");
  cell.setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold")
      .setFontSize(11).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setColumnWidth(8, 90);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 8, lastRow - 1, 1).setValue("관심");
  }
  applyConditionalFormatting(sheet);
  SpreadsheetApp.flush();
}

function applyConditionalFormatting(sheet) {
  const statusRange = sheet.getRange("H2:H1000");
  const appliedRange = sheet.getRange("I2:I1000");
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("관심").setBackground("#f3f4f6").setFontColor("#374151")
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("지원 완료").setBackground("#dbeafe").setFontColor("#1d4ed8")
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("서류 통과").setBackground("#ede9fe").setFontColor("#6d28d9")
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("1차 면접").setBackground("#fef3c7").setFontColor("#d97706")
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("합격").setBackground("#d1fae5").setFontColor("#065f46")
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("불합격").setBackground("#fee2e2").setFontColor("#dc2626")
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("TRUE").setBackground("#d1fae5").setFontColor("#065f46")
      .setRanges([appliedRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("FALSE").setBackground("#fef3c7").setFontColor("#92400e")
      .setRanges([appliedRange]).build()
  ]);
}

function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clearContents();
  sheet.clearFormats();
  const headers = ["날짜", "출처", "회사", "직무/포지션", "위치", "근무형태", "연봉/페이", "진행 상태", "지원여부", "URL", "직무설명"];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground("#1e3a5f");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 36);
  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 90);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 210);
  sheet.setColumnWidth(5, 110);
  sheet.setColumnWidth(6, 100);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 90);
  sheet.setColumnWidth(9, 80);
  sheet.setColumnWidth(10, 60);
  sheet.setColumnWidth(11, 300);
  sheet.setFrozenRows(1);
  applyConditionalFormatting(sheet);
  sheet.getRange("A2:K1000").setWrap(false).setVerticalAlignment("middle");
  sheet.setRowHeightsForced(2, 999, 26);
  SpreadsheetApp.flush();
}

// --- 구글 시트 내 진행 상태 버튼 (사이드바) ---
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Recruit Tracker")
    .addItem("상태 변경 패널 열기", "openStatusSidebar")
    .addToUi();
}

function openStatusSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("StatusSidebar")
    .setTitle("진행 상태")
    .setWidth(180);
  SpreadsheetApp.getUi().showSidebar(html);
}

function setStatusFromSidebar(status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getActiveRange();
  if (!range) throw new Error("변경할 행의 셀을 먼저 선택해주세요.");
  const row = range.getRow();
  if (row === 1) throw new Error("헤더 행은 수정할 수 없습니다.");
  sheet.getRange(row, 8).setValue(status);  // H열 = 진행 상태
  sheet.getRange(row, 9).setValue(["지원 완료", "서류 통과", "1차 면접", "합격"].includes(status) ? "TRUE" : "FALSE");
}
```

**HTML 파일 추가:** Apps Script에서 **파일 → 새로 만들기 → HTML** → 이름 `StatusSidebar` → [`google-sheets/StatusSidebar.html`](google-sheets/StatusSidebar.html) 내용 복사

### 2. 웹 앱 배포

**배포 → 새 배포** → 유형: 웹 앱 → 액세스: 모든 사용자 → 배포 URL 복사

### 3. URL 설정

`background.js` 1번 줄 `GOOGLE_APPS_SCRIPT_WEBAPP_URL`에 복사한 URL 입력

### 4. 기존 시트 마이그레이션 (진행 상태 컬럼 추가)

이미 데이터가 있는 시트에 "진행 상태" 컬럼을 추가하려면:
Apps Script 에디터에서 `migrateStatusColumnIfNeeded` 함수를 선택 후 **▶ 실행**

### 5. 구글 시트에서 진행 상태 버튼 사용 (선택)

위 Apps Script에 `onOpen`, `openStatusSidebar`, `setStatusFromSidebar`가 포함되어 있습니다.  
**StatusSidebar.html**을 추가한 뒤 시트를 새로고침하면 **Recruit Tracker → 상태 변경 패널 열기** 메뉴가 나타납니다.  
변경할 행의 셀을 선택한 뒤 사이드바 버튼을 클릭하면 됩니다.

## Google Sheets 컬럼 구성

```
날짜 | 출처 | 회사 | 직무/포지션 | 위치 | 근무형태 | 연봉/페이 | 진행 상태 | 지원여부 | URL | 직무설명
```

## 파일 구조

```
recruit-tracker/
├── manifest.json       # Chrome 확장 설정 (Manifest V3)
├── background.js       # Service Worker: 페이지 파싱 + 저장 + Sheets 전송
├── popup.html          # 확장 팝업 UI
├── popup.js            # 팝업 로직
├── README.md
├── google-sheets/      # 구글 시트 사이드바 버튼 설정 (선택)
│   ├── README.md
│   └── StatusSidebar.html
└── updates/
    ├── CHANGELOG.md    # 버전별 변경 이력
    └── TODO.md         # 개선 예정 항목
```
