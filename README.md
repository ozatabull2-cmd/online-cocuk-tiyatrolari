# Ücretsiz Online Çocuk Tiyatroları 🎭

Ankara Çocuk bünyesinde hazırlanan, çocuklara özel ücretsiz YouTube tiyatro gösterileri uygulaması.

## 🚀 Özellikler

- 🎬 YouTube videoları embed player ile izleme
- 📱 Mobil öncelikli, premium tasarım
- 🔐 Yönetici paneli (video ekleme/düzenleme/silme)
- 📝 Sayfa metinlerini yönetme
- 🔥 Firebase Firestore entegrasyonu
- 💾 Offline mod (LocalStorage fallback)
- 🏷️ Kategori & yaş grubu filtreleme

## 📁 Dosya Yapısı

```
├── index.html        # Ana sayfa
├── admin.html        # Yönetici paneli
├── style.css         # Ana sayfa stilleri
├── admin.css         # Admin paneli stilleri
├── app.js            # Ana sayfa JS
├── admin.js          # Admin paneli JS
├── vercel.json       # Vercel deployment ayarları
└── README.md
```

## ⚙️ Kurulum

### 1️⃣ İlk Kullanım (Firebase olmadan)

1. Dosyaları tarayıcıda açın (veya Vercel'e yükleyin)
2. `admin.html` sayfasına gidin
3. "Firebase olmadan devam et" butonuna tıklayın
4. Şifre: `admin123`
5. Video eklemeye başlayın!

### 2️⃣ Firebase ile Kullanım (Önerilen)

1. [Firebase Console](https://console.firebase.google.com)'a gidin
2. Ankara Çocuk projenizi seçin (veya yeni proje oluşturun)
3. Firestore Database oluşturun
4. Web uygulaması ekleyin, config bilgilerini alın
5. `admin.html` açılışında Firebase bilgilerini girin
6. Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tiyatro_videos/{doc} {
      allow read: if true;
      allow write: if false; // Admin JS ile yönetilir
    }
    match /tiyatro_settings/{doc} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 3️⃣ GitHub'a Yükleme

```bash
git init
git add .
git commit -m "İlk sürüm: Çocuk Tiyatrosu uygulaması"
git remote add origin https://github.com/KULLANICI_ADI/cocuk-tiyatrosu.git
git push -u origin main
```

### 4️⃣ Vercel'e Deploy

1. [Vercel](https://vercel.com) hesabı açın
2. "New Project" → GitHub repo seçin
3. Deploy butonuna tıklayın
4. Vercel link hazır! Ankara Çocuk uygulamasına ekleyin.

## 🔗 Ankara Çocuk Uygulamasına Ekleme

Vercel linkinizi (örn: `https://cocuk-tiyatrosu.vercel.app`) Ankara Çocuk admin panelinden mini uygulama olarak ekleyin.

## 👩‍💼 Admin Paneli Kullanımı

- **Video Ekle**: YouTube linkini yapıştırın, başlık ve açıklama girin
- **Kategori**: Masal, Müzikal, Macera vb. seçin
- **Sıralama**: Sıra numarası ile videoların görünüm sırası ayarlanır
- **Gizle/Göster**: Aktif kutucuğu ile video görünürlüğü kontrol edilir
- **Sayfa Metinleri**: Başlıklar, duyuru metni düzenlenebilir

---
*Ankara Çocuk © 2025*
