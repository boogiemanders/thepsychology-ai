/*
 * SimplePractice self-pay roster scraper (bookmarklet source).
 *
 * USE: open  https://secure.simplepractice.com/clients?billingType=Self-pay
 *      then click the bookmarklet (see scrape-selfpay.bookmarklet.txt).
 *
 * It auto-scrolls the lazy-loaded client list, harvests every client-name link
 * (the list virtualizes, so names are collected on each pass into a Set), and
 * downloads self-pay-roster.json in the format audit.py expects.
 *
 * If SimplePractice changes its markup and this stops working, the only line
 * likely to need a tweak is the CLIENT_LINK selector below.
 */
(async () => {
  const CLIENT_LINK = 'a[href*="/clients/"]';        // client-name links -> /clients/<id>
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const names = new Set();

  const harvest = () => {
    document.querySelectorAll(CLIENT_LINK).forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!/\/clients\/\d+/.test(href)) return;        // skip nav / non-client links
      const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && t.length > 1 && !/^clients$/i.test(t)) names.add(t);
    });
  };

  // Find the scrollable container that holds the list (fall back to the page).
  const scroller = (() => {
    let el = document.querySelector(CLIENT_LINK);
    while (el && el !== document.body) {
      const oy = getComputedStyle(el).overflowY;
      if (/(auto|scroll)/.test(oy) && el.scrollHeight > el.clientHeight + 20) return el;
      el = el.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  })();

  let stable = 0, last = -1;
  for (let i = 0; i < 300 && stable < 5; i++) {
    harvest();
    scroller.scrollTop += Math.max(400, scroller.clientHeight * 0.9);
    window.scrollBy(0, 800);                            // belt + suspenders for window-scroll layouts
    await sleep(250);
    if (names.size === last) stable++; else { stable = 0; last = names.size; }
  }
  harvest();

  const roster = {
    _comment:
      "Scraped from SimplePractice Self-pay billing-type filter. Couples may render as a short display name here; audit.py's drift detector flags any unmatched self-pay payers so nothing is missed.",
    captured: new Date().toISOString().slice(0, 10),
    source: location.href,
    self_pay: [...names].sort((a, b) => a.localeCompare(b)),
  };
  const json = JSON.stringify(roster, null, 2);

  // Download the file.
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'self-pay-roster.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // Backups: clipboard + console.
  try { await navigator.clipboard.writeText(json); } catch (e) {}
  console.log('[selfpay] scraped', names.size, 'clients', [...names].sort());
  alert(`Scraped ${names.size} self-pay clients.\nDownloaded self-pay-roster.json (also copied to clipboard).`);
})();
