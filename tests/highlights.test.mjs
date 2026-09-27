import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { performerId, watchBadges, loadEngagement } from '../frontend/badges.mjs';

const tick = () => new Promise(resolve => setTimeout(resolve, 50));
function fixture(html) {
  return new JSDOM(html, { url: 'http://localhost/videos', pretendToBeVisual: true });
}

test('uses performer identities, supports legacy routes, and ignores unsafe or ambiguous links', () => {
  const dom = fixture('<a></a>');
  const badge = dom.window.document.querySelector('a');
  for (const [href, expected] of [
    ['/performer/12?tab=videos', 12], ['/#/performer/42', 42],
    ['/performer/0', null], ['/performers', null], ['/video/12', null],
    ['https://elsewhere.test/performer/12', null], ['/performer/9007199254740993', null],
  ]) {
    badge.setAttribute('href', href);
    assert.equal(performerId(badge), expected, href);
  }
  dom.window.close();
});

test('highlights only favorites, follows inserted/recycled cards, removes highlights and cleans up', async () => {
  const dom = fixture('<a class="performer-badge" href="/performer/1">Same name</a><a class="performer-badge" href="/performer/2">Same name</a>');
  const document = dom.window.document;
  const snapshots = [];
  const watcher = watchBadges(document, ids => snapshots.push(ids));
  assert.deepEqual(snapshots[0], [1, 2]);
  watcher.update([{ hostId: 1, isFavorite: true }, { hostId: 2, isFavorite: false }]);
  await tick();
  assert.equal(document.querySelectorAll('[data-performer-highlight]').length, 1);
  const badge = document.querySelector('a');
  badge.setAttribute('href', '/performer/2');
  document.body.insertAdjacentHTML('beforeend', '<a class="performer-badge" href="/performer/1">New card</a>');
  await tick();
  assert.equal(badge.hasAttribute('data-performer-highlight'), false);
  assert.equal(document.querySelectorAll('[data-performer-highlight]').length, 1);
  watcher.update([{ hostId: 1, isFavorite: false }]);
  await tick();
  assert.equal(document.querySelectorAll('[data-performer-highlight]').length, 0);
  watcher.update([{ hostId: 2, isFavorite: true }]);
  await tick();
  assert.equal(document.querySelectorAll('[data-performer-highlight]').length, 2);
  watcher.stop();
  assert.equal(document.querySelectorAll('[data-performer-highlight]').length, 0);
  document.body.insertAdjacentHTML('beforeend', '<a class="performer-badge" href="/performer/3">After unload</a>');
  await tick();
  assert.deepEqual(snapshots.at(-1), [1, 2]);
  dom.window.close();
});

test('loads large card sets in bounded authenticated batches and propagates cancellation', async () => {
  const ids = Array.from({ length: 205 }, (_, i) => i + 1);
  const signal = new AbortController().signal;
  const sizes = [];
  const result = await loadEngagement(ids, async (url, options) => {
    assert.equal(url, '/api/engagement/batch');
    assert.equal(options.signal, signal);
    const body = JSON.parse(options.body);
    assert.equal(body.hostType, 'performer');
    sizes.push(body.hostIds.length);
    return { ok: true, json: async () => body.hostIds.map(hostId => ({ hostId, isFavorite: hostId === 1 })) };
  }, signal);
  assert.deepEqual(sizes, [100, 100, 5]);
  assert.equal(result.length, 205);
  await assert.rejects(loadEngagement([1], async () => ({ ok: false, status: 403 }), signal), /403/);
});
