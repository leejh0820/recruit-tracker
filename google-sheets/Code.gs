function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const body = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    setupSheet();
  } else {
    migrateSheetIfNeeded(sheet);
    migrateStatusColumnIfNeeded(sheet);
    migrateRemoveAppliedColumnIfNeeded(sheet);
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

// 기존 시트의 "지원여부" 열(I열) 자동 제거
function migrateRemoveAppliedColumnIfNeeded(sheet) {
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // I열(9번째)이 "지원여부"인 경우에만 삭제
  if (sheet.getRange(1, 9).getValue() !== "지원여부") return;
  sheet.deleteColumn(9);
  applyConditionalFormatting(sheet);
  SpreadsheetApp.flush();
}

function applyConditionalFormatting(sheet) {
  const statusRange = sheet.getRange("H2:H1000");
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
      .setRanges([statusRange]).build()
  ]);
}

function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // ⚠️ 주의: 이 함수를 직접 실행하면 모든 데이터가 삭제됩니다. doPost에서만 자동 호출됩니다.
  sheet.clearContents();
  sheet.clearFormats();
  const headers = ["날짜", "출처", "회사", "직무/포지션", "위치", "근무형태", "연봉/페이", "진행 상태", "URL", "직무설명"];
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
  sheet.setColumnWidth(9, 60);
  sheet.setColumnWidth(10, 300);
  sheet.setFrozenRows(1);
  applyConditionalFormatting(sheet);
  sheet.getRange("A2:J1000").setWrap(false).setVerticalAlignment("middle");
  sheet.setRowHeightsForced(2, 999, 26);
  SpreadsheetApp.flush();
}

// --- 진행 상태: 행별 드롭다운 (셀 클릭 시 선택) ---
const STATUS_OPTIONS = ["관심", "지원 완료", "서류 통과", "1차 면접", "합격", "불합격"];
const STATUS_COL = 8;   // H열 = 진행 상태

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Recruit Tracker")
    .addItem("상태 열에 드롭다운 적용 (행별 선택)", "applyStatusDropdown")
    .addSeparator()
    .addItem("상태 변경 패널 열기 (사이드바)", "openStatusSidebar")
    .addSeparator()
    .addItem("지원여부 열 제거 (기존 시트 정리)", "removeAppliedColumn")
    .addSeparator()
    .addItem("잘못된 드롭다운 정리 (H열 외 validation 제거)", "clearWrongValidation")
    .addToUi();
}

// 각 행의 진행상태 셀에 드롭다운 적용 - 셀 클릭 시 버튼처럼 선택 가능
function applyStatusDropdown() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const range = sheet.getRange(2, STATUS_COL, lastRow - 1, 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
  SpreadsheetApp.getUi().alert("적용 완료! 이제 각 행의 진행상태 셀을 클릭하면 선택할 수 있습니다.");
}

function openStatusSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("StatusSidebar")
    .setTitle("진행 상태")
    .setWidth(180);
  SpreadsheetApp.getUi().showSidebar(html);
}

// 기존 시트에서 "지원여부" 열 수동 제거 (메뉴에서 실행)
function removeAppliedColumn() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  // I열(9번째) 확인
  const colVal = sheet.getRange(1, 9).getValue();
  if (colVal !== "지원여부") {
    ui.alert("I열이 '지원여부'가 아닙니다 (현재 값: " + colVal + "). 이미 제거되었거나 열 위치가 다릅니다.");
    return;
  }
  const res = ui.alert("I열 '지원여부'를 삭제합니다. 계속하시겠습니까?", ui.ButtonSet.OK_CANCEL);
  if (res !== ui.Button.OK) return;
  sheet.deleteColumn(9);
  applyConditionalFormatting(sheet);
  ui.alert("완료! '지원여부' 열이 제거되었습니다.");
}

// H열(진행 상태) 외 모든 열의 잘못된 데이터 유효성 검사 제거
function clearWrongValidation() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const lastCol = sheet.getLastColumn();
  // H열(8) 제외한 모든 데이터 열의 validation 제거
  for (let col = 1; col <= lastCol; col++) {
    if (col === STATUS_COL) continue;
    sheet.getRange(2, col, lastRow - 1, 1).clearDataValidations();
  }
  SpreadsheetApp.getUi().alert("완료! H열(진행 상태) 외 모든 드롭다운이 제거되었습니다.");
}

function setStatusFromSidebar(status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getActiveRange();
  if (!range) throw new Error("변경할 행의 셀을 먼저 선택해주세요.");
  const row = range.getRow();
  if (row === 1) throw new Error("헤더 행은 수정할 수 없습니다.");
  sheet.getRange(row, STATUS_COL).setValue(status);
}

function getCurrentRowInfo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getActiveRange();
  if (!range) return null;
  const row = range.getRow();
  if (row <= 1) return null;
  const status = sheet.getRange(row, STATUS_COL).getValue();
  const company = sheet.getRange(row, 3).getValue();
  return { row, status, company };
}

// 드롭다운 선택 시 자동 반영 (onEdit 트리거)
function onEdit(e) {
  if (!e || !e.range) return;
  const col = e.range.getColumn();
  const row = e.range.getRow();
  if (row === 1 || col !== STATUS_COL) return;
  // 드롭다운으로 변경된 경우 특별한 추가 처리 없음 (값 자체가 상태)
}
