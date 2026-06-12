/**
 * SP Client Reach -> Google Sheet bridge.
 *
 * One-time setup (5 minutes):
 * 1. Open the leadership Google Sheet.
 * 2. Extensions > Apps Script. Delete whatever is in the editor, paste this whole file.
 * 3. Click Deploy > New deployment > type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone with the link
 * 4. Click Deploy, authorize, copy the Web app URL.
 * 5. Paste that URL into the SP Client Reach extension settings (gear icon).
 *
 * The TOKEN below must match the "Shared token" in the extension settings.
 * The extension ships with this same default, so you only paste the URL.
 */

var TOKEN = 'inz-r8-93kx7q4ftn2m';

function doPost(e) {
  var out;
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.token !== TOKEN) {
      out = { ok: false, error: 'bad token' };
    } else if (!data.tab || !data.header || !data.rows) {
      out = { ok: false, error: 'missing tab/header/rows' };
    } else {
      out = writeTab(String(data.tab), data.header, data.rows);
    }
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function writeTab(tabName, header, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // sheet tab names max out at 100 chars
  tabName = tabName.slice(0, 100);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName, 0);
  } else {
    sheet.clearContents();
    sheet.clearFormats();
  }
  var values = [header].concat(rows);
  var width = header.length;
  // pad ragged rows so setValues doesn't choke
  values = values.map(function (r) {
    r = r.slice(0, width);
    while (r.length < width) r.push('');
    return r;
  });
  sheet.getRange(1, 1, values.length, width).setValues(values);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#f3f4f6');
  sheet.setFrozenRows(1);
  for (var c = 1; c <= width; c++) sheet.autoResizeColumn(c);
  return {
    ok: true,
    rows: rows.length,
    url: ss.getUrl() + '#gid=' + sheet.getSheetId(),
  };
}
