# Google Sheets 진행 상태 버튼 (StatusSidebar.html)

메인 [README.md](../README.md)의 Apps Script 설정에 사이드바 코드가 포함되어 있습니다.

Apps Script에서 **파일 → 새로 만들기 → HTML** → 이름 `StatusSidebar`로 생성 후, 아래 HTML 코드를 붙여넣으세요.

```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { font-family: -apple-system, sans-serif; font-size: 13px; padding: 12px; margin: 0; }
    h3 { margin: 0 0 10px; font-size: 14px; }
    .status-btn {
      display: block; width: 100%; padding: 8px 12px; margin-bottom: 6px;
      font-size: 12px; font-weight: 600; border: none; border-radius: 6px;
      cursor: pointer; text-align: left;
    }
    .status-btn:hover { filter: brightness(1.05); }
    .status-btn[data-status="관심"]       { background: #f3f4f6; color: #374151; }
    .status-btn[data-status="지원 완료"]  { background: #dbeafe; color: #1d4ed8; }
    .status-btn[data-status="서류 통과"]  { background: #ede9fe; color: #6d28d9; }
    .status-btn[data-status="1차 면접"]   { background: #fef3c7; color: #d97706; }
    .status-btn[data-status="합격"]       { background: #d1fae5; color: #065f46; }
    .status-btn[data-status="불합격"]     { background: #fee2e2; color: #dc2626; }
    .hint { font-size: 11px; color: #6b7280; margin-top: 12px; line-height: 1.4; }
  </style>
</head>
<body>
  <h3>진행 상태 변경</h3>
  <p class="hint">변경할 행의 셀을 선택한 뒤 버튼을 클릭하세요.</p>
  <button type="button" class="status-btn" data-status="관심">관심</button>
  <button type="button" class="status-btn" data-status="지원 완료">지원 완료</button>
  <button type="button" class="status-btn" data-status="서류 통과">서류 통과</button>
  <button type="button" class="status-btn" data-status="1차 면접">1차 면접</button>
  <button type="button" class="status-btn" data-status="합격">합격</button>
  <button type="button" class="status-btn" data-status="불합격">불합격</button>
  <script>
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        google.script.run
          .withSuccessHandler(() => alert('변경 완료!'))
          .withFailureHandler((err) => alert('오류: ' + err))
          .setStatusFromSidebar(btn.dataset.status);
      });
    });
  </script>
</body>
</html>
```

저장 후 시트를 새로고침하면 **Recruit Tracker → 상태 변경 패널 열기** 메뉴가 나타납니다.
