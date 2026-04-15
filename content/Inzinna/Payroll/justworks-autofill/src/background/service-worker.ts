// Service worker for JustWorks Payroll Autofill
// Handles message relay between popup and content scripts

chrome.runtime.onInstalled.addListener(() => {
  console.log('JustWorks Payroll Autofill installed')
})

// Relay messages if needed (popup <-> content script communication
// is handled directly via chrome.tabs.sendMessage, but this keeps
// the service worker alive for future features like:
// - CSV processing history
// - Export to clipboard in background
// - Badge updates showing payroll status)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_PAYROLL') {
    chrome.storage.local.get('payrollData', (data) => {
      sendResponse(data.payrollData || null)
    })
    return true
  }
})
