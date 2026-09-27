const selector = '.performer-badge';
const attribute = 'data-performer-highlight';

export function performerId(badge) {
  const href = badge.getAttribute('href');
  if (!href) return null;
  try {
    const url = new URL(href, badge.ownerDocument.baseURI);
    if (url.origin !== new URL(badge.ownerDocument.baseURI).origin) return null;
    const path = url.hash.startsWith('#/') ? url.hash.slice(1).split('?')[0] : url.pathname;
    const match = /^\/performer\/(\d+)\/?$/.exec(path);
    const id = match ? Number(match[1]) : 0;
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch { return null; }
}

// Observe the public badge markup, never React internals. Work is coalesced per frame.
export function watchBadges(document, onIds) {
  const window = document.defaultView;
  let favorites = new Set();
  let previousIds = '';
  let frame = null;
  function scan() {
    frame = null;
    const ids = new Set();
    for (const badge of document.querySelectorAll(selector)) {
      const id = performerId(badge);
      if (id !== null) ids.add(id);
      const active = favorites.has(id);
      if (active && badge.getAttribute(attribute) !== 'favorite') badge.setAttribute(attribute, 'favorite');
      if (!active && badge.hasAttribute(attribute)) badge.removeAttribute(attribute);
    }
    const key = [...ids].sort((a, b) => a - b).join(',');
    if (key !== previousIds) {
      previousIds = key;
      onIds(key ? key.split(',').map(Number) : []);
    }
  }
  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(scan);
  }
  const observer = new window.MutationObserver(schedule);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['href', 'class'] });
  scan();
  return {
    update(entries) {
      favorites = new Set(entries.filter(entry => entry.isFavorite).map(entry => entry.hostId));
      schedule();
    },
    stop() {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      for (const badge of document.querySelectorAll(`[${attribute}]`)) badge.removeAttribute(attribute);
    },
  };
}

export async function loadEngagement(ids, request, signal) {
  const entries = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const response = await request('/api/engagement/batch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
      body: JSON.stringify({ hostType: 'performer', hostIds: ids.slice(offset, offset + 100) }),
    });
    if (!response.ok) throw new Error(`Performer highlights: request failed (${response.status})`);
    entries.push(...await response.json());
  }
  return entries;
}
