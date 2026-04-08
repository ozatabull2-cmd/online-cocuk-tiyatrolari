// ==========================================
// ÇOCUK TİYATROSU — ADMİN PANELİ JS
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ==========================================
// STATE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBPbEuGqVofWdohAHJKqtmfEBN0Oc03Ya8",
  authDomain: "ankaracocukv3-b2182.firebaseapp.com",
  projectId: "ankaracocukv3-b2182",
  storageBucket: "ankaracocukv3-b2182.firebasestorage.app",
  messagingSenderId: "678969625372",
  appId: "1:678969625372:web:6e910af53e1218ab4488d9"
};

let db = null;
let videos = [];
let editingVideoId = null;
let deleteTargetId = null;
let unsubscribeVideos = null;

// ==========================================
// NULL-SAFE HELPERS
// ==========================================
function el(id) {
  return document.getElementById(id);
}

function on(id, event, fn) {
  const elem = el(id);
  if (elem) elem.addEventListener(event, fn);
  else console.warn("Element bulunamadı:", id);
}

// ==========================================
// STORAGE HELPERS
// ==========================================
function save(key, value) {
  localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

function load(key) {
  const v = localStorage.getItem(key);
  if (!v) return null;
  try { return JSON.parse(v); } catch(e) { return v; }
}

// ==========================================
// FIREBASE INIT
// ==========================================
function initFirebase(config) {
  try {
    if (window._tiyatroAdminApp) {
      db = getFirestore(window._tiyatroAdminApp);
      return true;
    }
    const app = initializeApp(config, "tiyatro-admin-" + Date.now());
    window._tiyatroAdminApp = app;
    db = getFirestore(app);

    // Veritabanına yazabilmek için gizli (anonim) giriş yap
    const auth = getAuth(app);
    signInAnonymously(auth).catch(err => console.warn("Auth hatası:", err));

    return true;
  } catch(e) {
    console.warn("Firebase init hatası:", e.message);
    return false;
  }
}

// ==========================================
// YOUTUBE UTILITIES
// ==========================================
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
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==========================================
// TOAST
// ==========================================
function toast(message, type = "success") {
  const container = el("toast-container");
  if (!container) return;
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || ""}</span><span>${escHtml(message)}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ==========================================
// SCREENS
// ==========================================
function showScreen(id) {
  ["login-screen", "setup-screen", "admin-layout"].forEach(s => {
    const elem = el(s);
    if (!elem) return;
    if (s === id) {
      elem.style.display = s === "admin-layout" ? "flex" : "flex";
    } else {
      elem.style.display = "none";
    }
  });
}

// ==========================================
// TAB NAVIGATION
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll(".admin-tab").forEach(t => { t.style.display = "none"; });
  const tab = el("tab-" + tabId);
  if (tab) tab.style.display = "block";
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const navEl = el("nav-" + tabId);
  if (navEl) navEl.classList.add("active");
  closeSidebar();
}

// ==========================================
// SIDEBAR (MOBİL)
// ==========================================
function openSidebar() {
  const sidebar = el("admin-sidebar");
  const overlay = el("sidebar-overlay");
  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.style.display = "block";
}

function closeSidebar() {
  const sidebar = el("admin-sidebar");
  const overlay = el("sidebar-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.style.display = "none";
}

// ==========================================
// AUTH
// ==========================================
function checkLogin() {
  const v = load("tiyatro_admin_logged");
  return v === true || v === "true";
}

function doLogin(pass) {
  const stored = load("tiyatro_admin_password") || "Ozz298610653329";
  if (pass === stored) {
    save("tiyatro_admin_logged", "true");
    return true;
  }
  return false;
}

// ==========================================
// VIDEO FORM
// ==========================================
function openVideoForm(video = null) {
  editingVideoId = video ? video.id : null;
  const panel = el("video-form-panel");
  const formTitle = el("video-form-title");
  if (!panel) return;

  panel.style.display = "block";
  if (formTitle) formTitle.textContent = video ? "✏️ Videoyu Düzenle" : "➕ Yeni Video Ekle";

  if (video) {
    setValue("video-doc-id",    video.id || "");
    setValue("video-url",       video.url || "");
    setValue("video-title",     video.title || "");
    setValue("video-desc",      video.description || "");
    setValue("video-category",  video.category || "");
    setValue("video-age-tag",   video.ageTag || "");
    setValue("video-order",     video.order || "");
    const chk = el("video-active");
    if (chk) chk.checked = video.active !== false;
    updateUrlPreview(video.url);
  } else {
    const form = el("video-form");
    if (form) form.reset();
    const preview = el("url-preview");
    if (preview) preview.style.display = "none";
  }

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setValue(id, val) {
  const elem = el(id);
  if (elem) elem.value = val;
}

function closeVideoForm() {
  const panel = el("video-form-panel");
  const form = el("video-form");
  if (panel) panel.style.display = "none";
  if (form) form.reset();
  editingVideoId = null;
}

function updateUrlPreview(url) {
  const thumb = getThumbnail(url);
  const preview = el("url-preview");
  const img = el("preview-thumbnail");
  if (!preview) return;
  if (thumb) {
    if (img) img.src = thumb;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
}

// ==========================================
// SAVE VIDEO
// ==========================================
async function saveVideo(data) {
  const btn = el("save-video-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span> Kaydediliyor...';
  }

  try {
    if (db) {
      if (editingVideoId) {
        await updateDoc(doc(db, "tiyatro_videos", editingVideoId), { ...data, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "tiyatro_videos"), { ...data, createdAt: serverTimestamp() });
      }
    } else {
      const list = load("tiyatro_videos") || [];
      if (editingVideoId) {
        const idx = list.findIndex(v => v.id === editingVideoId);
        if (idx !== -1) list[idx] = { ...list[idx], ...data };
        else list.push({ id: editingVideoId, ...data });
      } else {
        list.push({ id: "local_" + Date.now(), ...data });
      }
      save("tiyatro_videos", list);
      renderVideoList(list);
    }
    toast(editingVideoId ? "Video güncellendi! ✅" : "Video eklendi! 🎬", "success");
    closeVideoForm();
  } catch(err) {
    console.error(err);
    toast("Hata: " + err.message, "error");
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = "<span>Kaydet</span>";
  }
}

// ==========================================
// DELETE VIDEO
// ==========================================
function openDeleteModal(videoId, title) {
  deleteTargetId = videoId;
  const textEl = el("delete-modal-text");
  if (textEl) textEl.textContent = `"${title}" başlıklı videoyu silmek istiyor musunuz?`;
  const modal = el("delete-modal");
  if (modal) modal.style.display = "flex";
}

function closeDeleteModal() {
  const modal = el("delete-modal");
  if (modal) modal.style.display = "none";
  deleteTargetId = null;
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  try {
    if (db) {
      await deleteDoc(doc(db, "tiyatro_videos", deleteTargetId));
    } else {
      const list = (load("tiyatro_videos") || []).filter(v => v.id !== deleteTargetId);
      save("tiyatro_videos", list);
      renderVideoList(list);
    }
    toast("Video silindi.", "info");
  } catch(err) {
    toast("Silme hatası: " + err.message, "error");
  }
  closeDeleteModal();
}

// ==========================================
// RENDER VIDEO LIST
// ==========================================
function renderVideoList(list) {
  const container = el("video-list");
  if (!container) return;

  const loading = el("list-loading");
  if (loading) loading.style.display = "none";

  container.innerHTML = "";

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="list-empty">
        <div class="list-empty-icon">🎭</div>
        <p>Henüz video eklenmedi. "Yeni Video Ekle" butonuna tıklayın.</p>
      </div>
    `;
    return;
  }

  const sorted = [...list].sort((a, b) => (a.order || 999) - (b.order || 999));

  sorted.forEach(video => {
    const item = document.createElement("div");
    item.className = "video-list-item" + (video.active === false ? " inactive" : "");

    const thumb = getThumbnail(video.url);

    item.innerHTML = `
      <img class="vli-thumb" src="${escHtml(thumb)}" alt="" loading="lazy"
           onerror="this.style.background='#e0d5ff'" />
      <div class="vli-body">
        <div class="vli-title">${escHtml(video.title)}</div>
        <div class="vli-meta">
          ${video.category ? `<span class="vli-tag">${escHtml(video.category)}</span>` : ""}
          ${video.ageTag ? `<span class="vli-tag">${escHtml(video.ageTag)}</span>` : ""}
          ${video.order ? `<span class="vli-tag">#${video.order}</span>` : ""}
          ${video.active === false ? `<span class="vli-tag inactive-tag">Gizli</span>` : ""}
        </div>
      </div>
      <div class="vli-actions">
        <button class="vli-btn edit-btn">✏️ Düzenle</button>
        <button class="vli-btn delete-btn">🗑️ Sil</button>
      </div>
    `;

    item.querySelector(".edit-btn").addEventListener("click", () => openVideoForm(video));
    item.querySelector(".delete-btn").addEventListener("click", () => openDeleteModal(video.id, video.title));

    container.appendChild(item);
  });
}

// ==========================================
// PAGE TEXTS
// ==========================================
async function savePageTexts(data) {
  try {
    if (db) {
      await setDoc(doc(db, "tiyatro_settings", "page_texts"), { ...data, updatedAt: serverTimestamp() });
    } else {
      save("tiyatro_page_texts", data);
    }
    toast("Metinler kaydedildi! ✍️", "success");
  } catch(err) {
    toast("Hata: " + err.message, "error");
  }
}

function loadPageTexts() {
  const stored = load("tiyatro_page_texts");
  if (!stored) return;
  const map = {
    "txt-app-title":    stored.appTitle,
    "txt-app-subtitle": stored.appSubtitle,
    "txt-announcement": stored.announcement,
    "txt-section-title": stored.sectionTitle,
    "txt-section-desc": stored.sectionDesc,
    "txt-footer-text":  stored.footerText,
  };
  for (const [id, val] of Object.entries(map)) {
    if (val) setValue(id, val);
  }
}

async function loadPageTextsFirestore() {
  if (!db) return;
  try {
    const snap = await getDoc(doc(db, "tiyatro_settings", "page_texts"));
    if (snap.exists()) {
      const data = snap.data();
      save("tiyatro_page_texts", data);
      loadPageTexts();
    }
  } catch(e) { console.warn("Metin yükleme:", e); }
}

// ==========================================
// SETTINGS
// ==========================================
function loadSettingsUI() {
  const config = load("tiyatro_firebase_config");
  if (!config) return;
  const map = {
    "s-api-key": "apiKey",
    "s-auth-domain": "authDomain",
    "s-project-id": "projectId",
    "s-storage-bucket": "storageBucket",
    "s-messaging-id": "messagingSenderId",
    "s-app-id": "appId"
  };
  for (const [elId, key] of Object.entries(map)) {
    if (config[key]) setValue(elId, config[key]);
  }
}

function saveSettings() {
  // Şifre değiştirme işlemi
  const newPass = el("s-new-password")?.value || "";
  const confirmPass = el("s-confirm-password")?.value || "";

  if (newPass) {
    if (newPass !== confirmPass) { toast("Şifreler eşleşmiyor!", "error"); return; }
    if (newPass.length < 6) { toast("Şifre en az 6 karakter olmalı!", "error"); return; }
    save("tiyatro_admin_password", newPass);
    toast("Şifre güncellendi! 🔐", "success");
  }
}

// ==========================================
// FIREBASE SUBSCRIBE
// ==========================================
function subscribeToVideos() {
  if (!db) return;
  if (unsubscribeVideos) unsubscribeVideos();
  unsubscribeVideos = onSnapshot(
    collection(db, "tiyatro_videos"),
    (snap) => {
      videos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderVideoList(videos);
    },
    (err) => {
      console.warn("Firestore snapshot hatası:", err);
      loadLocalVideos();
    }
  );
}

// ==========================================
// PANEL INIT
// ==========================================
function initAdminPanel() {
  const ok = initFirebase(firebaseConfig);
  if (ok) {
    subscribeToVideos();
    loadPageTextsFirestore();
  } else {
    loadLocalVideos();
  }

  loadPageTexts();
  loadSettingsUI();
}

function loadLocalVideos() {
  const list = load("tiyatro_videos") || [];
  videos = list;
  renderVideoList(list);
  const loading = el("list-loading");
  if (loading) loading.style.display = "none";
}

// ==========================================
// SETUP SCREEN
// ==========================================
function handleSetupSubmit(e) {
  e.preventDefault();
  const config = {
    apiKey: (el("fb-api-key")?.value || "").trim(),
    authDomain: (el("fb-auth-domain")?.value || "").trim(),
    projectId: (el("fb-project-id")?.value || "").trim(),
    storageBucket: (el("fb-storage-bucket")?.value || "").trim(),
    messagingSenderId: (el("fb-messaging-id")?.value || "").trim(),
    appId: (el("fb-app-id")?.value || "").trim(),
  };
  const password = el("admin-password-setup")?.value || "";

  if (!config.apiKey || !config.projectId || !config.appId) {
    const errEl = el("setup-error");
    if (errEl) { errEl.textContent = "API Key, Project ID ve App ID zorunludur."; errEl.style.display = "block"; }
    return;
  }

  save("tiyatro_firebase_config", config);
  save("tiyatro_admin_password", password || "admin123");
  save("tiyatro_setup_done", "true");
  showScreen("login-screen");
  toast("Yapılandırma kaydedildi! Giriş yapabilirsiniz.", "success");
}

// ==========================================
// UYGULAMA BAŞLATMA
// ==========================================
function startApp() {
  // Setup artık hardcoded olduğu için direkt login veya admin ekranına geçiyoruz
  const loggedIn = checkLogin();

  if (loggedIn) {
    showScreen("admin-layout");
    initAdminPanel();
  } else {
    showScreen("login-screen");
  }

  // --- LOGIN ---
  on("login-form", "submit", (e) => {
    e.preventDefault();
    const pass = el("admin-password")?.value || "";
    if (doLogin(pass)) {
      showScreen("admin-layout");
      initAdminPanel();
    } else {
      const errEl = el("login-error");
      if (errEl) { errEl.textContent = "Şifre yanlış! Lütfen tekrar deneyin."; errEl.style.display = "block"; }
    }
  });

  // --- SETUP ---
  on("setup-form", "submit", handleSetupSubmit);
  on("skip-setup-btn", "click", () => {
    save("tiyatro_setup_done", "true");
    save("tiyatro_admin_password", "admin123");
    toast("Offline modda çalışıyorsunuz. Şifre: admin123", "info");
    showScreen("login-screen");
  });

  // --- LOGOUT ---
  on("logout-btn", "click", () => {
    localStorage.removeItem("tiyatro_admin_logged");
    showScreen("login-screen");
    toast("Çıkış yapıldı.", "info");
  });

  // --- TAB NAVİGASYONU ---
  document.querySelectorAll(".nav-item[data-tab]").forEach(navEl => {
    navEl.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(navEl.dataset.tab);
    });
  });

  // --- SIDEBAR (MOBİL) ---
  on("menu-toggle", "click", openSidebar);
  on("sidebar-overlay", "click", closeSidebar);

  // --- VİDEO FORM ---
  on("add-video-btn", "click", () => openVideoForm());
  on("close-video-form", "click", closeVideoForm);
  on("cancel-video-form", "click", closeVideoForm);
  on("video-url", "input", (e) => updateUrlPreview(e.target.value.trim()));

  on("video-form", "submit", async (e) => {
    e.preventDefault();
    const url = (el("video-url")?.value || "").trim();
    if (!getYouTubeId(url) && !url.includes("youtube")) {
      toast("Geçerli bir YouTube linki girin!", "error");
      return;
    }
    const data = {
      url,
      title:       (el("video-title")?.value || "").trim(),
      description: (el("video-desc")?.value || "").trim(),
      category:    (el("video-category")?.value || "").trim() || "Tiyatro",
      ageTag:      (el("video-age-tag")?.value || "").trim() || "Tüm yaşlar",
      order:       parseInt(el("video-order")?.value) || 999,
      active:      el("video-active")?.checked ?? true,
    };
    await saveVideo(data);
  });

  // --- SAYFA METİNLERİ ---
  on("texts-form", "submit", async (e) => {
    e.preventDefault();
    const data = {
      appTitle:    (el("txt-app-title")?.value || "").trim(),
      appSubtitle: (el("txt-app-subtitle")?.value || "").trim(),
      announcement:(el("txt-announcement")?.value || "").trim(),
      sectionTitle:(el("txt-section-title")?.value || "").trim(),
      sectionDesc: (el("txt-section-desc")?.value || "").trim(),
      footerText:  (el("txt-footer-text")?.value || "").trim(),
    };
    await savePageTexts(data);
    save("tiyatro_page_texts", data);
  });

  // --- AYARLAR ---
  on("clear-all-btn", "click", () => {
    if (!confirm("TÜM veriler silinecek! Emin misiniz?")) return;
    ["tiyatro_videos","tiyatro_page_texts","tiyatro_firebase_config","tiyatro_setup_done"]
      .forEach(k => localStorage.removeItem(k));
    toast("Tüm veriler silindi.", "info");
    setTimeout(() => location.reload(), 1000);
  });

  // --- SİLME MODALİ ---
  on("cancel-delete", "click", closeDeleteModal);
  on("confirm-delete", "click", confirmDelete);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDeleteModal(); });
}

// Sayfa yüklenince başlat
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
