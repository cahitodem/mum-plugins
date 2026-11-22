// MUM modification 2026-11-21. GPL-3.0-only; see LICENSE and NOTICE.md.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeText,
  tokenize,
  calculateMatchScore,
  pickBestCandidate
} = require('../src/shared/matching.js');

test('matching: normalizeText folds Turkish characters and strips special characters', () => {
  assert.equal(normalizeText('Çığlık Ötesi Şarkılar (1999) - HD'), 'ciglik otesi sarkilar 1999 hd');
  assert.equal(normalizeText('FAMILY GUY: Death Has a Shadow!'), 'family guy death has a shadow');
});

test('matching: tokenize removes stop words and short tokens', () => {
  const tokens = tokenize('The Last of Us - 1. Sezon 1. Bölüm izle');
  assert.deepEqual(tokens, ['last', 'us']);
});

test('matching: Family Guy (1999) vs Holy Family (2022) MUST be rejected', () => {
  const result = calculateMatchScore('Family Guy', '1999', 'Holy Family', '/dizi/holy-family', '2022');
  assert.equal(result.matched, false);
});

test('matching: multi-word query with 50% coverage is rejected (minCoverage 0.75)', () => {
  const result = calculateMatchScore('Family Guy', null, 'Holy Family', '/dizi/holy-family', null);
  assert.equal(result.matched, false);
});

test('matching: year mismatch > 1 year is rejected even on high coverage', () => {
  const result = calculateMatchScore('Dune', '2021', 'Dune', '/film/dune', '1984');
  assert.equal(result.matched, false);
  assert.match(result.reason, /year_mismatch/);
});

test('matching: year difference <= 1 is accepted with bonus', () => {
  const resultExact = calculateMatchScore('Spider-Man', '2002', 'Spider-Man', '/film/spider-man', '2002');
  assert.equal(resultExact.matched, true);
  assert.equal(resultExact.score, 125);

  const resultOffset = calculateMatchScore('Spider-Man', '2002', 'Spider-Man', '/film/spider-man', '2001');
  assert.equal(resultOffset.matched, true);
  assert.equal(resultOffset.score, 110);
});

test('matching: exact title or slug match succeeds', () => {
  const res = calculateMatchScore('Game of Thrones', '2011', 'Game of Thrones', '/dizi/game-of-thrones', '2011');
  assert.equal(res.matched, true);
  assert.equal(res.reason, 'exact_title_match');
});

test('matching: pickBestCandidate returns best match among valid candidates', () => {
  const candidates = [
    { title: 'Holy Family', year: '2022', href: '/dizi/holy-family' },
    { title: 'A Model Family', year: '2022', href: '/dizi/a-model-family' },
    { title: 'The Atypical Family', year: '2024', href: '/dizi/the-atypical-family' }
  ];

  const matched = pickBestCandidate(candidates, 'Family Guy', '1999');
  assert.equal(matched, null, 'No candidate should match Family Guy');
});

test('matching: pickBestCandidate NEVER returns candidates[0] on zero valid matches', () => {
  const candidates = [
    { title: 'Random Show A', year: '2020', href: '/show-a' },
    { title: 'Random Show B', year: '2021', href: '/show-b' }
  ];

  const matched = pickBestCandidate(candidates, 'Breaking Bad', '2008');
  assert.equal(matched, null);
});

test('matching: pickBestCandidate correctly selects candidate with matching title and year', () => {
  const candidates = [
    { title: 'Breaking Bad: Bonus Material', year: '2013', href: '/breaking-bad-bonus' },
    { title: 'Breaking Bad', year: '2008', href: '/dizi/breaking-bad' }
  ];

  const matched = pickBestCandidate(candidates, 'Breaking Bad', '2008');
  assert.ok(matched);
  assert.equal(matched.title, 'Breaking Bad');
});

test('matching: The Odyssey (2026) vs Cosmos: A Spacetime Odyssey (2014) MUST be rejected', () => {
  const result = calculateMatchScore('The Odyssey', '2026', 'Cosmos: A Spacetime Odyssey', '/dizi/cosmos-a-spacetime-odyssey-izle-1', '2014');
  assert.equal(result.matched, false);
  assert.match(result.reason, /year_mismatch/);

  // Even without year, token coverage should reject it (1 word vs 4 words)
  const resultNoYear = calculateMatchScore('The Odyssey', null, 'Cosmos: A Spacetime Odyssey', '/dizi/cosmos-a-spacetime-odyssey-izle-1', null);
  // 'the' is stop word, target token is 'odyssey', candidate has 'cosmos', 'spacetime', 'odyssey'
  // extra tokens penalty or pickBestCandidate with threshold
  const candidates = [
    { title: 'Cosmos: A Spacetime Odyssey', year: '2014', href: '/dizi/cosmos-a-spacetime-odyssey-izle-1' }
  ];
  const matched = pickBestCandidate(candidates, 'The Odyssey', '2026');
  assert.equal(matched, null, 'Cosmos must never match The Odyssey');
});

test('matching: Malcolm in the Middle (2000) vs Malcolm in the Middle: Life\'s Still Unfair (2026) MUST be rejected by year mismatch', () => {
  const result = calculateMatchScore('Malcolm in the Middle', '2000', "Malcolm in the Middle: Life's Still Unfair", '/malcolm-in-the-middle-lifes-still-unfair', '2026');
  assert.equal(result.matched, false);
  assert.match(result.reason, /year_mismatch/);
});

test('matching: Malcolm in the Middle vs Malcolm in the Middle: Life\'s Still Unfair MUST be rejected even without year (subtitle penalty)', () => {
  const result = calculateMatchScore('Malcolm in the Middle', null, "Malcolm in the Middle: Life's Still Unfair", '/malcolm-in-the-middle-lifes-still-unfair', null);
  assert.equal(result.matched, false, 'Life\'s Still Unfair must be rejected due to heavy extra token / subtitle penalty');
});

test('matching: pickBestCandidate rejects Malcolm in the Middle: Life\'s Still Unfair candidate', () => {
  const candidates = [
    { title: "Malcolm in the Middle: Life's Still Unfair", slug: '/malcolm-in-the-middle-lifes-still-unfair', year: '2026' }
  ];
  const matchedWithYear = pickBestCandidate(candidates, 'Malcolm in the Middle', '2000');
  assert.equal(matchedWithYear, null);

  const matchedWithoutYear = pickBestCandidate(candidates, 'Malcolm in the Middle', null);
  assert.equal(matchedWithoutYear, null);
});
