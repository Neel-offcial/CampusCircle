// =========================================================================
// CampusCircle Companion Extension - Background Service Worker (Manifest V3)
// Handles external messaging from CampusCircle Web App (localhost:5188)
// =========================================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CampusCircle Extension] Companion Service Worker registered successfully.');
});

// External message listener for CampusCircle Web App
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('[CampusCircle Extension] Received external message from:', sender.url, request);

  if (!request) return;

  if (request.type === 'PING') {
    sendResponse({
      success: true,
      status: 'active',
      name: 'CampusCircle Companion',
      version: '1.0.0'
    });
    return true;
  }

  if (request.type === 'getAttendance') {
    chrome.storage.local.get('studentHubAttendance', (res) => {
      sendResponse({
        success: true,
        attendance: res.studentHubAttendance || null,
        extractedAt: res.studentHubAttendance?.extractedAt || null
      });
    });
    return true; // Keep channel open for async response
  }

  if (request.type === 'saveAttendance' && request.attendance) {
    chrome.storage.local.set({ studentHubAttendance: request.attendance }, () => {
      sendResponse({ success: true, message: 'Attendance stored in extension local cache.' });
    });
    return true;
  }
});
