# FacultyPro V5.0 - Secure Attendance System

**Developed by Zinc Labs**

FacultyPro is a smart, offline-first Android application designed specifically for college faculty. Version 5.0 introduces a robust "Freemium" model with secure licensing, modular architecture, and dynamic theming.

![FacultyPro Banner](https://img.shields.io/badge/Version-V5.0-gold) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 New in V5.0 (Zinc Release)

- **🔐 Secure Hybrid Licensing:** Replaced insecure master keys with SHA-256 hashed secure keys. Only authorized keys can unlock Premium features.
- **🎨 Modular Architecture:** The entire app has been refactored into modular components (`js/features/`) for better performance and easier updates.
- **✨ Dynamic Premium UI:**
  - **Standard Mode:** Blue/Gray theme with basic features.
  - **Premium Mode:** Unlocks the "DSU Gold" theme, Analytics Dashboard, and advanced settings upon entering a secure key.
- **🐛 Bug Fixes:** Resolved attendance page layout overlaps and navigation issues.

---

## 📱 Features

- **No Internet Required:** Works 100% offline using local IndexedDB.
- **Fast Attendance:** Mark an entire class "Present" in one click.
- **Smart Analytics:** Track student attendance percentages automatically.
- **Export Data:** Generate PDF and CSV reports for your records.
- **Data Backup:** Export/Restore your database (JSON format).

---

## 🛠️ How to Install

1. **Download:** Go to the [Releases Page](../../releases) and download `app-debug.apk`.
2. **Install:** Tap to install (Enable "Unknown Sources" if prompted).
3. **Setup:** Create your profile and start adding classes!

---

## 👨‍💻 Tech Stack

- **Developer:** Zinc Labs
- **Frontend:** HTML5, TailwindCSS, Vanilla JS (Modular)
- **Security:** SHA-256 Crypto API
- **Storage:** IndexedDB

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Zinc Labs
