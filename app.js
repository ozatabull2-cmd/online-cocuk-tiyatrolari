// ==========================================
// ÇOCUK TİYATROSU — ANA SAYFA JS
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---- Firebase Config (firebase-config.js'den alınabilir ya da buraya gömülür) ----
// İlk açılışta bu alanı kendi Firebase proje bilgilerinizle güncelleyin.
// Admin panelini ilk kaydettiğinizde bu ayarlar Firestore'a da yazan ile senkron olur.

let firebaseConfig = null;
let db = null;
let videos = [];
let currentFilter = "all";

// ---- LocalStorage fallback config ----
function loadConfig() {
  const stored = localStorage.getItem("tiyatro_firebase_config");
  if (stored) {
    try { firebaseConfig = JSON.parse(stored); } catch(e) {}
  }
}

// ---- Init Firebase ----
function initFirebase() {
  if (!firebaseConfig || !firebaseConfig.projectId) return false;
  try {
    const app = initializeApp(firebaseConfig, "tiyatro-app");
    db = getFirestore(app);
    return true;
  } catch(e) {
    console.warn("Firebase init error:", e);
    return false;
  }
}

// ---- Utility: extract YouTube ID ----
function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getThumbnail(url) {
  const id = getYouTubeId(url);
  if (!id) return "https://placehold.co/640x360/6c35de/ffffff?text=🎭+Tiyatro";
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function getEmbedUrl(url) {
  const id = getYouTubeId(url);
  if (!id) return "";
  // modestbranding: YouTube logosunu gizler
  // rel=0: "Sonraki videolar" önerisini kapatır
  // iv_load_policy=3: bilgi notlarını gizler
  // disablekb=0: klavye kısayolları aktif
  // fs=1: tam ekran izin ver (kullanıcı deneyimi için)
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;
}

// ---- Render Videos ----
function renderVideos(list) {
  const grid = document.getElementById("video-grid");
  const empty = document.getElementById("empty-state");
  const countEl = document.getElementById("video-count");

  grid.innerHTML = "";

  const filtered = currentFilter === "all"
    ? list
    : list.filter(v => v.category === currentFilter);

  if (countEl) countEl.textContent = list.length;

  if (filtered.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  filtered.forEach((video, index) => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${video.title} izle`);
    card.id = `video-card-${index}`;

    const thumb = getThumbnail(video.url);
    const cat = video.category || "Tiyatro";
    const ageTag = video.ageTag || "3-10 yaş";

    card.innerHTML = `
      <div class="card-thumbnail">
        <img src="${thumb}" alt="${escapeHtml(video.title)}" loading="lazy" />
        <div class="play-overlay">
          <div class="play-btn">▶</div>
        </div>
        <span class="card-badge">Ücretsiz</span>
      </div>
      <div class="card-body">
        <div class="card-category">${escapeHtml(cat)}</div>
        <h3 class="card-title">${escapeHtml(video.title)}</h3>
        ${video.description ? `<p class="card-desc">${escapeHtml(video.description)}</p>` : ""}
        <div class="card-footer">
          <button class="card-watch-btn" onclick="event.stopPropagation()">▶ İzle</button>
          <span class="card-age-tag">${escapeHtml(ageTag)}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openModal(video));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") openModal(video); });
    grid.appendChild(card);
  });
}

// ---- Filter Tabs ----
function buildFilterTabs(list) {
  const container = document.getElementById("filter-tabs");
  const categories = ["all", ...new Set(list.map(v => v.category).filter(Boolean))];

  container.innerHTML = categories.map(cat => `
    <button 
      class="filter-tab ${cat === currentFilter ? "active" : ""}" 
      data-filter="${escapeHtml(cat)}"
    >
      ${cat === "all" ? "Tümü" : escapeHtml(cat)}
    </button>
  `).join("");

  container.querySelectorAll(".filter-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      container.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderVideos(videos);
    });
  });
}

// ---- Page Texts ----
function applyPageTexts(texts) {
  if (!texts) return;
  const fields = {
    "app-title": texts.appTitle,
    "app-subtitle": texts.appSubtitle,
    "section-title": texts.sectionTitle,
    "section-desc": texts.sectionDesc,
    "announcement-text": texts.announcement,
    "footer-text": texts.footerText,
  };
  for (const [id, val] of Object.entries(fields)) {
    if (val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }
  }
}

// ---- Modal ----
function openModal(video) {
  const modal = document.getElementById("video-modal");
  document.getElementById("modal-video-title").textContent = video.title || "Gösteri";
  document.getElementById("modal-video-desc").textContent = video.description || "";
  document.getElementById("youtube-iframe").src = getEmbedUrl(video.url);

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("video-modal");
  modal.classList.remove("open");
  document.getElementById("youtube-iframe").src = "";
  document.body.style.overflow = "";
}

// ---- Escape HTML ----
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- Load from Firestore ----
async function loadFromFirestore() {
  try {
    // Videos
    onSnapshot(collection(db, "tiyatro_videos"), (snap) => {
      videos = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(v => v.active !== false)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      renderVideos(videos);
      buildFilterTabs(videos);
    });

    // Page texts
    const textsDoc = await getDoc(doc(db, "tiyatro_settings", "page_texts"));
    if (textsDoc.exists()) {
      applyPageTexts(textsDoc.data());
    }
  } catch (err) {
    console.error("Firestore error:", err);
    loadFromLocalStorage();
  }
}

// ---- Load from LocalStorage (offline fallback) ----
function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem("tiyatro_videos");
    if (stored) {
      videos = JSON.parse(stored).filter(v => v.active !== false);
      renderVideos(videos);
      buildFilterTabs(videos);
    } else {
      // Demo videos (ilk açılış)
      videos = getDemoVideos();
      renderVideos(videos);
      buildFilterTabs(videos);
    }

    const texts = localStorage.getItem("tiyatro_page_texts");
    if (texts) applyPageTexts(JSON.parse(texts));
  } catch(e) {
    videos = getDemoVideos();
    renderVideos(videos);
  }
}

// ---- Demo Videos ----
function getDemoVideos() {
  return [
    {
      id: "demo1",
      title: "Kırmızı Başlıklı Kız — Çocuk Tiyatrosu",
      description: "Dünyaca ünlü peri masalı, çocuk tiyatrosu sahnesine taşındı! Eğlenceli ve eğitici bir gösteri.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Masal",
      ageTag: "4-8 yaş",
      active: true,
      order: 1
    },
    {
      id: "demo2",
      title: "Pamuk Prenses ve Yedi Cüceler",
      description: "Sevimli cüceler ve Pamuk Prenses'in büyülü dünyasına hoş geldiniz!",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Masal",
      ageTag: "3-9 yaş",
      active: true,
      order: 2
    },
    {
      id: "demo3",
      title: "Pinokyo'nun Maceraları",
      description: "Yalancılığın sonu nereye varır? Pinokyo ile birlikte öğrenin!",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      category: "Macera",
      ageTag: "5-10 yaş",
      active: true,
      order: 3
    }
  ];
}

// ---- Handle Ankara Çocuk Login ----
function handleAppLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  
  if (emailParam) {
    // E-postayı localStorage'a kaydet (uygulamada gezindikçe hatırlanması için)
    localStorage.setItem('ankara_cocuk_user_email', emailParam);
    
    // URL'den email parametresini temizle (daha temiz görünmesi için)
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Kayıtlı e-posta varsa ekranda göster
  const savedEmail = localStorage.getItem('ankara_cocuk_user_email');
  if (savedEmail) {
    const greeting = document.getElementById('user-greeting');
    const emailDisplay = document.getElementById('user-email-display');
    if (greeting && emailDisplay) {
      emailDisplay.textContent = savedEmail;
      greeting.style.display = 'inline-block';
    }
  }
}

// ---- Back to Top ----
window.addEventListener("scroll", () => {
  const btn = document.getElementById("back-to-top");
  if (window.scrollY > 300) btn.classList.add("visible");
  else btn.classList.remove("visible");
});

// ---- Init ----
(async function init() {
  // Ankara Çocuk giriş kontrolü
  handleAppLogin();

  // Modal close
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("video-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Load config
  loadConfig();
  const firebaseOk = initFirebase();

  if (firebaseOk) {
    await loadFromFirestore();
  } else {
    loadFromLocalStorage();
  }
})();
