let lastParsed = null;
let cachedApplications = [];

const $ = (id) => document.getElementById(id);

const parseBtn = $("parseBtn");
const saveBtn = $("saveBtn");
const copyCsvBtn = $("copyCsvBtn");
const statusEl = $("status");
const companyInput = $("companyInput");
const titleInput = $("titleInput");
const locationInput = $("locationInput");
const workTypeInput = $("workTypeInput");
const salaryInput = $("salaryInput");
const appliedSelect = $("appliedSelect");
const urlInput = $("urlInput");
const descriptionInput = $("descriptionInput");
const applicationsTbody = $("applicationsTbody");

function setStatus(text, isError) {
  statusEl.textContent = text || "";
  statusEl.style.color = isError ? "#dc2626" : "#4b5563";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return iso;
  }
}

function fillForm(app) {
  companyInput.value = app.company || "";
  titleInput.value = app.title || "";
  locationInput.value = app.location || "";
  workTypeInput.value = app.workType || "";
  salaryInput.value = app.salary || "";
  appliedSelect.value = app.applied ? "true" : "false";
  urlInput.value = app.url || "";
  descriptionInput.value = app.description || "";
  lastParsed = { ...app };
  saveBtn.disabled = false;
}

function renderApplications(applications) {
  cachedApplications = applications || [];
  applicationsTbody.innerHTML = "";

  if (!cachedApplications.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "아직 저장된 지원 이력이 없습니다.";
    td.style.color = "#9ca3af";
    tr.appendChild(td);
    applicationsTbody.appendChild(tr);
    return;
  }

  cachedApplications.forEach((app) => {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = formatDate(app.capturedAt);
    dateTd.style.whiteSpace = "nowrap";

    const companyTd = document.createElement("td");
    companyTd.textContent = app.company || "";
    companyTd.style.maxWidth = "100px";
    companyTd.style.overflow = "hidden";
    companyTd.style.textOverflow = "ellipsis";
    companyTd.style.whiteSpace = "nowrap";

    const titleTd = document.createElement("td");
    titleTd.textContent = app.title || "";
    titleTd.style.maxWidth = "120px";
    titleTd.style.overflow = "hidden";
    titleTd.style.textOverflow = "ellipsis";
    titleTd.style.whiteSpace = "nowrap";

    const locationTd = document.createElement("td");
    locationTd.textContent = app.location || "";
    locationTd.style.maxWidth = "80px";
    locationTd.style.overflow = "hidden";
    locationTd.style.textOverflow = "ellipsis";
    locationTd.style.whiteSpace = "nowrap";

    // 지원 여부 토글 버튼
    const appliedTd = document.createElement("td");
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-btn " + (app.applied ? "applied" : "not-applied");
    toggleBtn.textContent = app.applied ? "지원완료" : "미지원";
    toggleBtn.title = "클릭해서 지원 여부 변경";
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: "TOGGLE_APPLIED", id: app.id }, (res) => {
        if (res && res.ok) {
          renderApplications(res.applications);
          setStatus(`'${app.company || app.title}' 지원 여부를 변경했습니다.`);
        }
      });
    });
    appliedTd.appendChild(toggleBtn);

    // 삭제 버튼
    const actionTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "삭제";
    deleteBtn.title = "이 이력 삭제";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(`'${app.company || app.title}' 이력을 삭제하시겠습니까?`)) return;
      chrome.runtime.sendMessage({ type: "DELETE_APPLICATION", id: app.id }, (res) => {
        if (res && res.ok) {
          renderApplications(res.applications);
          setStatus("이력을 삭제했습니다.");
        }
      });
    });
    actionTd.appendChild(deleteBtn);

    // 행 클릭 시 폼에 불러오기
    tr.addEventListener("click", () => {
      fillForm(app);
      setStatus(`'${app.company || app.title}' 정보를 불러왔습니다. 수정 후 저장 가능합니다.`);
    });

    tr.appendChild(dateTd);
    tr.appendChild(companyTd);
    tr.appendChild(titleTd);
    tr.appendChild(locationTd);
    tr.appendChild(appliedTd);
    tr.appendChild(actionTd);

    applicationsTbody.appendChild(tr);
  });
}

function loadApplications() {
  chrome.runtime.sendMessage({ type: "GET_APPLICATIONS" }, (res) => {
    renderApplications(res && res.ok ? res.applications : []);
  });
}

parseBtn.addEventListener("click", () => {
  setStatus("현재 탭에서 공고 정보를 가져오는 중...");
  saveBtn.disabled = true;

  chrome.runtime.sendMessage({ type: "PARSE_CURRENT_PAGE" }, (res) => {
    if (!res || !res.ok) {
      setStatus("공고 정보를 가져오지 못했습니다. 공고 상세 페이지에서 다시 시도해보세요.", true);
      return;
    }

    const data = res.data || {};
    lastParsed = data;
    fillForm(data);
    saveBtn.disabled = false;
    setStatus("정보를 가져왔습니다. 확인 후 필요하면 수정하고 '저장'을 누르세요.");
  });
});

saveBtn.addEventListener("click", () => {
  if (!lastParsed) {
    setStatus("먼저 '현재 페이지 정보 가져오기'를 눌러주세요.", true);
    return;
  }

  const job = {
    ...lastParsed,
    company: companyInput.value.trim(),
    title: titleInput.value.trim(),
    location: locationInput.value.trim(),
    workType: workTypeInput.value.trim(),
    salary: salaryInput.value.trim(),
    applied: appliedSelect.value === "true",
    url: urlInput.value.trim(),
    description: descriptionInput.value.trim()
  };

  chrome.runtime.sendMessage({ type: "SAVE_APPLICATION", job }, (res) => {
    if (!res || !res.ok) {
      setStatus("저장 중 오류가 발생했습니다.", true);
      return;
    }
    renderApplications(res.applications);
    setStatus("저장 완료!");
  });
});

copyCsvBtn.addEventListener("click", async () => {
  if (!cachedApplications.length) {
    setStatus("복사할 이력이 없습니다.", true);
    return;
  }

  const header = ["capturedAt", "company", "title", "location", "workType", "salary", "applied", "url", "description"];

  const escape = (value) => {
    if (value == null) return "";
    const str = String(value).replace(/"/g, '""');
    if (/[",\n]/.test(str)) return `"${str}"`;
    return str;
  };

  const lines = [
    header.join(","),
    ...cachedApplications.map((app) =>
      header.map((key) => escape(app[key])).join(",")
    )
  ];

  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    setStatus("CSV 복사 완료! 구글 스프레드시트에 바로 붙여넣기 하세요.");
  } catch (e) {
    setStatus("클립보드 복사 실패. 브라우저 설정을 확인해보세요.", true);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadApplications();
});
