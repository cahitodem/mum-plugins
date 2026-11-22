// MUM modification 2026-11-21. GPL-3.0-only; see LICENSE and NOTICE.md.

var STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'bir', 've', 'ile', 'icin', 'de', 'da', 'izle', 'dizi', 'dizisi', 'film', 'filmi', 'bolum', 'sezon', 'hd', 'full'
]);

function normalizeText(str) {
  if (!str) return '';
  return String(str).toLowerCase()
    .replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u').replace(/[şŞ]/g, 's')
    .replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .replace(/[âáàÂÁÀ]/g, 'a').replace(/[îíÎÍ]/g, 'i').replace(/[ûúÛÚ]/g, 'u')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(str) {
  var norm = normalizeText(str);
  if (!norm) return [];
  return norm.split(/\s+/).filter(function(w) {
    return w.length > 1 && !STOP_WORDS.has(w);
  });
}

function cleanSlug(slug) {
  if (!slug) return '';
  try {
    var last = String(slug).split('/').filter(Boolean).pop() || '';
    return last
      .replace(/-film-izle.*$/i, '')
      .replace(/-izle.*$/i, '')
      .replace(/-dizi.*$/i, '')
      .replace(/-turkce.*$/i, '')
      .replace(/-/g, ' ')
      .trim();
  } catch (_) {
    return String(slug).replace(/-/g, ' ');
  }
}

/**
 * Calculates a match score between a target title and candidate.
 * Returns { matched: boolean, score: number, reason: string }
 */
function calculateMatchScore(targetTitle, targetYear, candTitle, candSlug, candYear, options) {
  var opts = options || {};
  var minCoverage = opts.minCoverage !== undefined ? opts.minCoverage : 0.75;
  var minScore = opts.minScore !== undefined ? opts.minScore : 50;

  var tNorm = normalizeText(targetTitle);
  var cNorm = normalizeText(candTitle);
  var sClean = cleanSlug(candSlug);
  var sNorm = normalizeText(sClean);

  if (!tNorm || (!cNorm && !sNorm)) {
    return { matched: false, score: 0, reason: 'empty_input' };
  }

  var targetY = parseInt(targetYear, 10);
  var candY = parseInt(candYear, 10);

  // Yıl kontrolü: Her iki tarafın yılı biliniyorsa ve aradaki fark > 1 ise doğrudan ret
  if (!isNaN(targetY) && !isNaN(candY) && targetY > 1900 && candY > 1900) {
    var diff = Math.abs(targetY - candY);
    if (diff > 1) {
      return { matched: false, score: 0, reason: 'year_mismatch_' + targetY + '_vs_' + candY };
    }
  }

  // 1. Tam İsim veya Tam Slug Eşleşmesi
  if (cNorm === tNorm || sNorm === tNorm) {
    var exactScore = 100;
    if (!isNaN(targetY) && !isNaN(candY) && targetY > 1900 && candY > 1900) {
      var yDiff = Math.abs(targetY - candY);
      if (yDiff === 0) exactScore += 25;
      else if (yDiff === 1) exactScore += 10;
    }
    return { matched: true, score: exactScore, reason: 'exact_title_match' };
  }

  // 2. Token Bazlı Kapsama Oranı (Word Coverage)
  var tTokens = tokenize(targetTitle);
  if (tTokens.length === 0) tTokens = tNorm.split(/\s+/).filter(Boolean);

  var cTokensList = tokenize(candTitle).concat(tokenize(sClean));
  var cTokens = new Set(cTokensList);

  var matchCount = 0;
  for (var i = 0; i < tTokens.length; i++) {
    if (cTokens.has(tTokens[i])) {
      matchCount++;
    }
  }

  var coverage = tTokens.length > 0 ? (matchCount / tTokens.length) : 0;
  if (coverage < minCoverage) {
    return {
      matched: false,
      score: 0,
      reason: 'low_coverage_' + Math.round(coverage * 100) + 'pct'
    };
  }

  var score = coverage * 70;

  // Ekstra kelime cezası: Aday başlığında hedefe ait olmayan fazladan kelimeler varsa puan kır
  var candUniqueTokens = new Set(tokenize(candTitle));
  var extraTokens = 0;
  candUniqueTokens.forEach(function(tok) {
    if (tTokens.indexOf(tok) === -1) extraTokens++;
  });
  if (extraTokens > 0) {
    // Eğer adayın kelimelerinin %50 veya daha fazlası hedefte yoksa veya ekstra kelime sayısı hedeften fazlaysa ağır ceza ver (alt başlık / spinoff koruması)
    var extraRatio = candUniqueTokens.size > 0 ? (extraTokens / candUniqueTokens.size) : 0;
    if (extraTokens >= 2 && (extraRatio >= 0.5 || extraTokens >= tTokens.length)) {
      score -= (extraTokens * 8 + 10);
    } else {
      score -= (extraTokens * 6);
    }
  }

  // Yıl Bonusu
  if (!isNaN(targetY) && !isNaN(candY) && targetY > 1900 && candY > 1900) {
    var yDiff2 = Math.abs(targetY - candY);
    if (yDiff2 === 0) score += 20;
    else if (yDiff2 === 1) score += 10;
  }

  if (score >= minScore) {
    return { matched: true, score: score, reason: 'token_match' };
  }

  return { matched: false, score: score, reason: 'score_below_threshold' };
}

/**
 * Given a list of candidates and target info, returns the best matching candidate,
 * or null if no candidate qualifies. NEVER returns an arbitrary fallback.
 */
function pickBestCandidate(candidates, targetTitle, targetYear, options) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (!targetTitle) return null;

  var best = null;
  var bestScore = -1;

  for (var i = 0; i < candidates.length; i++) {
    var cand = candidates[i];
    if (!cand) continue;

    var cTitle = cand.title || cand.name || cand.baslik || cand.orijinalBaslik || '';
    var cSlug = cand.slug || cand.url || cand.href || '';
    var cYear = cand.year || cand.yil || '';

    // Eğer yıl nesnede doğrudan yoksa URL veya metin içinden 4 haneli yıl ara
    if (!cYear) {
      var ym = (String(cTitle) + ' ' + String(cSlug) + ' ' + String(cand.meta || '')).match(/\b(19\d\d|20\d\d)\b/);
      if (ym) cYear = ym[1];
    }

    var res = calculateMatchScore(targetTitle, targetYear, cTitle, cSlug, cYear, options);
    if (res.matched && res.score > bestScore) {
      bestScore = res.score;
      best = cand;
    }
  }

  return best;
}

module.exports = {
  STOP_WORDS: STOP_WORDS,
  normalizeText: normalizeText,
  tokenize: tokenize,
  cleanSlug: cleanSlug,
  calculateMatchScore: calculateMatchScore,
  pickBestCandidate: pickBestCandidate
};
