# 📚 ReadOra — Your Books. Your World.

<p align="center">
  <img src="assets/brand/readora-logo.png" alt="ReadOra Logo" width="160"/>
</p>

<h3 align="center">Your Personal Digital Library</h3>

<p align="center">
  A premium, modern and offline-first digital reading application built for book lovers.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white"/>
  <img src="https://img.shields.io/badge/React_Native-0.88.0-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Expo-SDK_58-000020?style=for-the-badge&logo=expo"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>
</p>

<p align="center">
  <a href="https://github.com/NitinCodes2408/Read_Ora">Repository</a> •
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-license">License</a>
</p>

---

## 📖 About ReadOra

**ReadOra** is a modern digital book-reading application designed to make reading more accessible, organized and enjoyable.

It provides a unified reading environment where users can import, organize, discover and read their favourite books in multiple digital formats.

Built with an offline-first approach, ReadOra allows readers to access their personal library and enjoy their reading experience without requiring a continuous internet connection.

From novels and biographies to educational and self-development books, ReadOra brings your digital reading journey into one place.

### ✨ Our Vision

To create a simple, elegant and personalized digital reading ecosystem that encourages people to read more and make reading a part of their everyday lives.

---

## 🚀 Features

### 📚 1. Personal Digital Library

- Import books directly from your device.
- Manage your personal digital book collection.
- Keep imported books organized in one place.
- Access locally stored books whenever needed.

### 📄 2. Multi-Format Book Reader

Read your favourite books in multiple formats.

| Format | Description |
|---|---|
| PDF | Read PDF documents with an integrated PDF reading engine. |
| EPUB | Enjoy structured digital books with EPUB rendering. |
| TXT | Read plain text documents in a clean interface. |

### 🔖 3. Bookmarks & Highlights

- Bookmark important reading positions.
- Highlight meaningful passages.
- Save important sections for later.
- Easily return to saved reading positions.

### 📊 4. Reading Insights

- Monitor your reading activity.
- Track reading progress.
- View reading statistics.
- Understand your reading habits.

### 🔍 5. Discover Books

- Explore books through the Discover section.
- Browse available book information.
- Find new reading material.
- Access online discovery features when internet connectivity is available.

### 🎨 6. Personalized Reading Experience

- Customizable reading preferences.
- Comfortable reading interface.
- Premium dark-themed design.
- Clean and distraction-free reading environment.

### 💾 7. Offline-First Experience

- Locally stored book files.
- Offline access to imported books.
- Local reading data management.
- Core reading functionality without continuous internet connectivity.

### 🌟 8. Premium User Experience

- Dedicated onboarding experience.
- Elegant application branding.
- Animated application introduction.
- Modern navigation and interface.
- Designed with a mobile-first approach.

---

## 📱 Screenshots

<p align="center">
  <b>Explore the ReadOra Experience</b>
</p>

<!-- Add your actual application screenshots inside assets/screenshots/ -->

| Home Screen | My Library |
|:---:|:---:|
| <img src="assets/screenshots/home.png" width="220" alt="Home Screen"/> | <img src="assets/screenshots/library.png" width="220" alt="Library Screen"/> |

| Discover | Reader |
|:---:|:---:|
| <img src="assets/screenshots/discover.png" width="220" alt="Discover Screen"/> | <img src="assets/screenshots/reader.png" width="220" alt="Reader Screen"/> |

| Reading Insights | Settings |
|:---:|:---:|
| <img src="assets/screenshots/insights.png" width="220" alt="Insights Screen"/> | <img src="assets/screenshots/settings.png" width="220" alt="Settings Screen"/> |

---

## 🛠️ Tech Stack

ReadOra is developed using modern mobile application technologies.

| Technology | Purpose |
|---|---|
| React Native | Mobile application framework |
| Expo SDK 58 | Development and build infrastructure |
| React 19 | User interface |
| TypeScript | Type-safe development |
| Expo Router | File-based navigation |
| Expo SQLite | Local database management |
| Expo File System | Local book file storage |
| PDF.js | PDF document rendering |
| JSZip | EPUB archive processing |

---

## 🏗️ Application Architecture

ReadOra follows an offline-first architecture with modular application components.

### Core Components

- **Presentation Layer:** React Native screens and reusable UI components.
- **Navigation Layer:** Expo Router.
- **Storage Layer:** SQLite database and local file system.
- **Reader Layer:** PDF.js, EPUB processing and TXT rendering.
- **Service Layer:** Book management, reading progress, bookmarks and other application services.

### Data Storage

ReadOra uses local storage to manage book records, metadata and reading progress.

Imported book files are stored locally on the device to support offline reading.

---

## 📂 Project Structure

```text
Read_Ora/
│
├── assets/
│   ├── brand/
│   ├── images/
│   ├── fonts/
│   └── videos/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── hooks/
│   ├── constants/
│   └── types/
│
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
└── .gitignore
```

*This is a high-level representation. Refer to the actual repository for the complete project organization.*

---

## ⚙️ Installation

Follow these steps to run ReadOra locally.

### Prerequisites

Make sure you have installed:

- Node.js (LTS recommended)
- npm
- Git
- Android Studio (for Android development)
- Expo-compatible development environment

### 1. Clone the Repository

```bash
git clone https://github.com/NitinCodes2408/Read_Ora.git
```

### 2. Navigate to the Project

```bash
cd Read_Ora
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npx expo start
```

Follow the Expo CLI instructions to open the application in your supported development environment.

---

## 📦 Android Production Build

ReadOra uses Expo Application Services (EAS) for Android production builds.

To generate a standalone Android APK using the configured production profile:

```bash
npx eas-cli@latest build --profile production-apk --platform android
```

An authenticated Expo account and configured EAS project are required.

---

## 🔐 Privacy & Data Storage

ReadOra is designed around a local-first reading experience.

- No mandatory login or signup.
- Imported books are stored locally on the device.
- Reading information is managed through local storage.
- Core reading functionality is designed to work offline.
- Internet access may be required for online discovery and connected features.

---

## 🗺️ Future Roadmap

Potential future improvements:

- [ ] Enhanced reading customization.
- [ ] Improved book discovery experience.
- [ ] Additional reading insights.
- [ ] More personalization options.
- [ ] Further accessibility and performance improvements.

---

## 🤝 Contributing

Suggestions, feedback and ideas are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Implement your changes.
4. Test your implementation.
5. Submit a Pull Request with a clear description.

Please discuss major changes before starting substantial development.

---

## 👨‍💻 Developer

<p align="center">
  <b>Nitin Bhandare</b>
  <br/>
  AI Engineering Student | Full Stack & Mobile Application Developer
</p>

<p align="center">
  <a href="https://github.com/NitinCodes2408">
    <img src="https://img.shields.io/badge/GitHub-NitinCodes2408-181717?style=for-the-badge&logo=github" alt="GitHub Profile"/>
  </a>
</p>

---

## 📄 License

ReadOra is licensed under the **MIT License**.

Copyright (c) 2026 Nitin Bhandare.

You are free to use, copy, modify, merge, publish, distribute, sublicense and sell copies of the software, subject to the terms of the MIT License.

See the [LICENSE](LICENSE) file for complete license terms.

---

<p align="center">
  <img src="assets/brand/readora-logo.png" width="75" alt="ReadOra Logo"/>
  <br/>
  <b>ReadOra — Your Books. Your World.</b>
  <br/>
  Made with ❤️ for book lovers.
</p>
