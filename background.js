const GOOGLE_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxNLeQriineV8q_s5SnkVlSSZwYnRcupwSmA-8K-qAthuIWL9T37UuyoKcDjnL3VmqJWw/exec";

function sendToGoogleSheet(job) {
  if (!GOOGLE_APPS_SCRIPT_WEBAPP_URL) return;
  fetch(GOOGLE_APPS_SCRIPT_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify(job)
  }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PARSE_CURRENT_PAGE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        sendResponse({ ok: false, error: "활성 탭을 찾을 수 없습니다." });
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            const url = window.location.href;
            const hostname = window.location.hostname;

            const getMetaContent = (name) => {
              const el =
                document.querySelector(`meta[name="${name}"]`) ||
                document.querySelector(`meta[property="${name}"]`);
              return el?.getAttribute("content") || "";
            };

            const titleFromHeading =
              document.querySelector("h1")?.innerText.trim() ||
              document.querySelector("h2")?.innerText.trim() ||
              document.title;

            let company = "";
            let locationText = "";
            let workType = "";
            let salary = "";
            let description = "";

            if (hostname.includes("linkedin.com")) {
              const companyEl =
                document.querySelector(".topcard__org-name-link") ||
                document.querySelector(".top-card-layout__company-url") ||
                document.querySelector("[data-tracking-control-name*='job_company']");
              company = companyEl?.textContent.trim() || "";

              const locationEl =
                document.querySelector(".topcard__flavor--bullet") ||
                document.querySelector(".topcard__flavor");
              locationText = locationEl?.textContent.trim() || "";

              const workTypeEl = Array.from(
                document.querySelectorAll("span,li")
              ).find((el) => {
                const t = el.textContent || "";
                return /remote|hybrid|on-site|on site|in-person|사무실|재택/i.test(t);
              });
              workType = workTypeEl?.textContent.trim() || "";

              // LinkedIn salary
              const salaryEl = document.querySelector(".compensation__salary") ||
                document.querySelector("[class*='salary']") ||
                document.querySelector("[class*='compensation']");
              salary = salaryEl?.textContent.trim() || "";

            } else if (hostname.includes("rememberapp.co.kr")) {
              // Remember 앱: 회사명은 보통 상단 링크 또는 특정 클래스
              const companyEl =
                document.querySelector("a[class*='company']") ||
                document.querySelector("[class*='companyName']") ||
                document.querySelector("[class*='company-name']") ||
                document.querySelector("[class*='corp']") ||
                document.querySelector("a[href*='/company/']");
              company = companyEl?.textContent.trim() || "";

              // 위치 추출 - 특정 패턴 텍스트 찾기
              const allTexts = Array.from(document.querySelectorAll("span,li,div,p"));
              const locationCandidate = allTexts.find((el) => {
                const t = (el.textContent || "").trim();
                return (
                  t.length < 50 &&
                  /^(서울|경기|인천|부산|대구|대전|광주|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)/.test(t)
                );
              });
              locationText = locationCandidate?.textContent.trim() || "";

              // 근무 형태
              const workTypeCandidate = allTexts.find((el) => {
                const t = (el.textContent || "").trim();
                return /^(Remote|Hybrid|On-site|In-Person|재택|사무실|혼합)$/i.test(t);
              });
              workType = workTypeCandidate?.textContent.trim() || "";

              // 연봉 - "연봉 협의", "연봉 5000만원" 등 "연봉"으로 시작하는 텍스트만
              const salaryCandidate = allTexts.find((el) => {
                const t = (el.textContent || "").trim();
                return (
                  t.length < 40 &&
                  /^(연봉|급여|페이)\s/.test(t)
                );
              });
              salary = salaryCandidate?.textContent.trim() || "";

              // Remember 앱 description: 네비/헤더 제거 + 푸터 제거
              {
                let descText = (document.querySelector("main") || document.body).innerText || "";

                // 탭 네비 이후부터 시작 ("기타안내" 뒤 + 보상금 문구 건너뛰기)
                const tabsIdx = descText.indexOf("기타안내");
                if (tabsIdx > 0) {
                  descText = descText.slice(tabsIdx + "기타안내".length).trim();
                }
                const bonusEnd = descText.indexOf("을 드립니다");
                if (bonusEnd > 0 && bonusEnd < 300) {
                  descText = descText.slice(bonusEnd + "을 드립니다".length).trim();
                }

                // 푸터 제거
                for (const marker of ["공고 목록 보기", "이 포지션에 필요한 전문분야", "이 공고와 비슷한", "리멤버에서 수집한 기업 정보"]) {
                  const idx = descText.indexOf(marker);
                  if (idx > 0) { descText = descText.slice(0, idx).trim(); break; }
                }

                description = descText;
              }

            } else if (hostname.includes("wanted.co.kr")) {
              const companyEl = document.querySelector("[class*='CompanyName']") ||
                document.querySelector("[class*='company-name']");
              company = companyEl?.textContent.trim() || "";

              const locationEl = document.querySelector("[class*='JobHeader'] [class*='location']") ||
                document.querySelector("[class*='job-location']");
              locationText = locationEl?.textContent.trim() || "";

              const salaryEl = document.querySelector("[class*='salary']") ||
                document.querySelector("[class*='Salary']");
              salary = salaryEl?.textContent.trim() || "";

            } else if (hostname.includes("jumpit.co.kr")) {
              const companyEl = document.querySelector("[class*='company']");
              company = companyEl?.textContent.trim() || "";

            } else if (hostname.includes("saramin.co.kr")) {
              const companyEl = document.querySelector(".company_nm a") ||
                document.querySelector(".corp_name a");
              company = companyEl?.textContent.trim() || "";

              const locationEl = document.querySelector(".work_place");
              locationText = locationEl?.textContent.trim() || "";

              const salaryEl = document.querySelector(".salary");
              salary = salaryEl?.textContent.trim() || "";
            }

            // 회사명 fallback
            if (!company) {
              const possibleCompany = Array.from(
                document.querySelectorAll("span,div,a,h2,h3")
              ).find((el) => {
                const t = el.textContent.trim();
                return (
                  t.length > 0 &&
                  t.length <= 40 &&
                  /회사|Inc\.|Corp\.|주식회사|\(주\)|유한회사|㈜/i.test(t)
                );
              });
              company = possibleCompany?.textContent.trim() || "";
            }

            // 사이트별 파싱이 없는 경우 fallback
            if (!description) {
              const mainEl =
                document.querySelector("main") ||
                document.querySelector("article") ||
                document.querySelector("[class*='posting']") ||
                document.querySelector("[class*='job-detail']") ||
                document.querySelector("[class*='jd']") ||
                document.body;
              const bodyText = mainEl.innerText || "";
              description = bodyText;
            }

            let source = "";
            if (hostname.includes("linkedin.com")) source = "LinkedIn";
            else if (hostname.includes("rememberapp.co.kr")) source = "Remember";
            else if (hostname.includes("wanted.co.kr")) source = "원티드";
            else if (hostname.includes("jumpit.co.kr")) source = "점핏";
            else if (hostname.includes("saramin.co.kr")) source = "사람인";
            else source = hostname;

            return {
              url,
              hostname,
              source,
              title: titleFromHeading,
              company,
              location: locationText,
              workType,
              salary,
              description,
              applied: false,
              capturedAt: new Date().toISOString()
            };
          }
        },
        (results) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          const data = results && results[0] ? results[0].result : null;
          sendResponse({ ok: true, data });
        }
      );
    });

    return true;
  }

  if (message.type === "SAVE_APPLICATION") {
    const job = message.job;
    chrome.storage.local.get({ applications: [] }, (res) => {
      const applications = Array.isArray(res.applications) ? res.applications : [];

      // 같은 URL이 이미 있으면 업데이트, 없으면 추가
      const existingIndex = applications.findIndex((a) => a.url === job.url);
      let jobWithId;
      if (existingIndex >= 0) {
        jobWithId = { ...applications[existingIndex], ...job };
        applications[existingIndex] = jobWithId;
      } else {
        jobWithId = { id: Date.now(), status: "관심", ...job };
        applications.unshift(jobWithId);
      }

      chrome.storage.local.set({ applications }, () => {
        sendToGoogleSheet(jobWithId);
        sendResponse({ ok: true, applications });
      });
    });

    return true;
  }

  if (message.type === "SET_STATUS") {
    const { id, status } = message;
    chrome.storage.local.get({ applications: [] }, (res) => {
      const applications = Array.isArray(res.applications) ? res.applications : [];
      const idx = applications.findIndex((a) => a.id === id);
      if (idx >= 0) {
        applications[idx].status = status;
        applications[idx].applied = ["지원 완료", "서류 통과", "1차 면접", "합격"].includes(status);
      }
      chrome.storage.local.set({ applications }, () => {
        sendResponse({ ok: true, applications });
      });
    });

    return true;
  }

  if (message.type === "DELETE_APPLICATION") {
    const { id } = message;
    chrome.storage.local.get({ applications: [] }, (res) => {
      const applications = (Array.isArray(res.applications) ? res.applications : [])
        .filter((a) => a.id !== id);
      chrome.storage.local.set({ applications }, () => {
        sendResponse({ ok: true, applications });
      });
    });

    return true;
  }

  if (message.type === "GET_APPLICATIONS") {
    chrome.storage.local.get({ applications: [] }, (res) => {
      const applications = (Array.isArray(res.applications) ? res.applications : []).map((app) => {
        if (!app.status) {
          app.status = app.applied ? "지원 완료" : "관심";
        }
        return app;
      });
      sendResponse({ ok: true, applications });
    });

    return true;
  }
});
