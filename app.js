import { GITHUB_OWNER, GITHUB_REPO } from "./settings.js";

const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();
const modal = $("adminModal");
const repoUrl = `https://github.com/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}`;
const releasesUrl = `${repoUrl}/releases`;
$("adminOpen").addEventListener("click", () => { modal.hidden = false; });
$("adminClose").addEventListener("click", () => { modal.hidden = true; });
modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });

function humanSize(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function setEmpty(message) {
  $("versionLine").textContent = message;
  $("emptyState").hidden = false;
  $("downloadButton").hidden = true;
}

async function loadLatest() {
  if (GITHUB_OWNER.startsWith("YOUR_") || !GITHUB_REPO) {
    setEmpty("กรุณาตั้งค่า GitHub Owner และ Repository ใน public/settings.js ก่อน");
    return;
  }
  try {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (response.status === 404) {
      setEmpty("ยังไม่มี Release หรือ Repository ยังไม่เป็นสาธารณะ");
      return;
    }
    if (!response.ok) throw new Error(`GitHub API ตอบกลับ ${response.status}`);
    const release = await response.json();
    const apk = (release.assets || []).find(asset => asset.name.toLowerCase().endsWith(".apk"));
    if (!apk) {
      setEmpty("พบ Release แล้ว แต่ยังไม่มีไฟล์ .apk แนบอยู่");
      return;
    }
    $("versionLine").textContent = `${release.name || release.tag_name || "ไม่ระบุเวอร์ชัน"}${release.body ? " — " + release.body : ""}`;
    $("sizeLine").textContent = humanSize(apk.size);
    $("dateLine").textContent = release.published_at
      ? new Date(release.published_at).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
      : "วันที่เผยแพร่ไม่ระบุ";
    $("downloadButton").href = apk.browser_download_url;
    $("downloadButton").removeAttribute("download");
    $("downloadButton").hidden = false;
    $("emptyState").hidden = true;
    $("releaseNotes").textContent = release.body || "ไม่มีรายละเอียดการอัปเดต";
    $("releaseNotesWrap").hidden = false;
  } catch (error) {
    console.error(error);
    setEmpty("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  }
}

$("adminRepoLink").href = repoUrl;
$("adminReleaseLink").href = releasesUrl;
$("refreshButton").addEventListener("click", loadLatest);
loadLatest();
