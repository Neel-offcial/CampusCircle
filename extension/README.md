# CampusCircle Companion • Chrome Extension (Manifest V3)

> Official browser companion for **CampusCircle** and **Atria Institute of Technology** students. Automatically extracts theory, lab, and elective attendance from the Atria Digital Campus portal without compromising student credentials.

---

## 🚀 Quick Start: Load Unpacked in 15 Seconds

You can load and use this extension in **Google Chrome**, **Brave**, **Microsoft Edge**, or any Chromium-based browser without publishing:

1. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`
2. In the top-right corner, toggle **Developer mode** to **ON**.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the directory:
   ```
   CampusCircle/extension
   ```
5. Pin the extension to your browser toolbar!

---

## 🔄 How the Sync Workflow Works

1. **Log in to Atria Digital Campus**:
   Navigate to [https://atriadigitalcampus.com/](https://atriadigitalcampus.com/) and log in with your USN and password.
2. **Open Attendance & IA Page**:
   Go to **Academics → Attendance / IA Marks** (`/EDUApp/student/iaAttendence*`).
3. **Automatic Extraction**:
   The content script automatically reads:
   - Theory courses conducted, attended, missed, and percentage.
   - Laboratory sessions (kept strictly separate per VTU guidelines).
   - Elective records.
4. **On-Screen Confirmation HUD**:
   A floating HUD pill will appear at the bottom-right of your screen confirming the sync.
5. **CampusCircle Reflection**:
   Return to CampusCircle (`http://localhost:5188/attendance`). Click **"Sync Live Attendance"** or paste the JSON. Your attendance health, 75% thresholds, and bunk limits update in real-time.

---

## 🌐 Public Release Guide: Publishing to Chrome Web Store

To make this extension available publicly on the official **Chrome Web Store** for all Atria students:

### 1. Prerequisites
- A Google account.
- One-time **$5 USD** developer registration fee paid to Google Chrome Web Store.
- Developer Dashboard: [https://chrome.google.com/webstore/devconsole/](https://chrome.google.com/webstore/devconsole/)

### 2. Package the Extension
Create a `.zip` file of the `CampusCircle/extension` folder (excluding git and documentation files):
```bash
cd CampusCircle/extension
zip -r ../CampusCircle-Companion.zip . -x "*.git*" "README.md"
```

### 3. Upload to Chrome Web Store Developer Dashboard
1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Click **Add new item**.
3. Drag & drop `CampusCircle-Companion.zip`.

### 4. Fill in Store Listing Details
- **Item Name**: `CampusCircle Companion - Atria Student Hub`
- **Summary**: `Live VTU attendance extractor and academic helper for Atria Institute of Technology students.`
- **Category**: `Productivity` or `Education`
- **Language**: `English`
- **Store Icons**:
  - 128x128 px PNG store icon
  - 1280x800 px screenshot of the popup & Atria portal sync HUD
  - 440x280 px promotional tile (optional)

### 5. Privacy Practices Tab
- **Single Purpose**: *"Extracts course attendance records from Atria Digital Campus portal to forecast VTU academic criteria and calculate safe bunk limits."*
- **Permission Justification**:
  - `storage`: Required to store course attendance metrics locally in the user's browser.
  - `host_permissions` (`https://atriadigitalcampus.com/*`): Required to read attendance table elements when logged into the university portal.
- **Data Usage Certification**:
  - Check *"Does not sell user data to third parties"*.
  - Check *"Does not use or transfer user data for unrelated purposes"*.
  - Check *"Does not use or transfer user data to determine creditworthiness"*.

### 6. Submit for Review
Click **Submit for Review**. Chrome Web Store automated verification typically approves standard extensions within 24 to 48 hours.

---

## 🔒 Security & Privacy Architecture
- **Zero Credentials Captured**: The extension never intercepts, prompts for, or reads your Atria portal login passwords.
- **Client-Side Parsing**: All table parsing happens locally in the browser sandbox.
- **No Third-Party Analytics**: Zero telemetry, tracking cookies, or advertising trackers.
