/**
 * Universal Stream Quality Sorter for Nuvio Providers
 * Sorts video streams by resolution score descending:
 * 4K (2160p) > 2K (1440p) > 1080p (FHD) > 720p (HD) > 540p > 480p (SD) > 360p > 240p
 * Adds slight priority (+1) to direct MP4 streams over HLS of the same resolution.
 */

function getQualityScore(s) {
    if (!s) return 0;
    if (!s.url) return 1;
    var q = ((s.quality || '') + ' ' + (s.title || '') + ' ' + (s.name || '')).toLowerCase();
    var score = 0;
    if (/\b(4k|2160p?|uhd)\b/.test(q)) score = 2160;
    else if (/\b(2k|1440p?|qhd)\b/.test(q)) score = 1440;
    else if (/\b(1080p?|fhd)\b/.test(q)) score = 1080;
    else if (/\b(720p?|hd)\b/.test(q)) score = 720;
    else if (/\b(540p?)\b/.test(q)) score = 540;
    else if (/\b(480p?|sd)\b/.test(q)) score = 480;
    else if (/\b(360p?)\b/.test(q)) score = 360;
    else if (/\b(240p?)\b/.test(q)) score = 240;

    if (score === 0 && s.title) {
        var text = s.title.toLowerCase();
        if (/\b(4k|2160p|uhd)\b/.test(text)) score = 2160;
        else if (/\b(2k|1440p|qhd)\b/.test(text)) score = 1440;
        else if (/\b(1080p|fhd)\b/.test(text)) score = 1080;
        else if (/\b(720p|hd)\b/.test(text)) score = 720;
        else if (/\b(480p|sd)\b/.test(text)) score = 480;
        else if (/\b(360p)\b/.test(text)) score = 360;
        else if (/\b(240p)\b/.test(text)) score = 240;
    }

    if (score === 0 && s.url) {
        var u = s.url.toLowerCase();
        if (/[\/_.-](2160p?|4k)[\/_.-]/.test(u)) score = 2160;
        else if (/[\/_.-](1440p?|2k)[\/_.-]/.test(u)) score = 1440;
        else if (/[\/_.-](1080p?|fhd)[\/_.-]/.test(u)) score = 1080;
        else if (/[\/_.-](720p?|hd)[\/_.-]/.test(u)) score = 720;
        else if (/[\/_.-](480p?|sd)[\/_.-]/.test(u)) score = 480;
        else if (/[\/_.-](360p?)[\/_.-]/.test(u)) score = 360;
    }

    var isDirectMp4 = s.format === 'mp4' || s.type === 'mp4' || (!s.isHls && s.url && (s.url.endsWith('.mp4') || s.url.includes('.mp4?')));
    if (isDirectMp4 && score > 0) score += 1;
    return score;
}

function sortStreamsByQuality(streams) {
    if (!Array.isArray(streams) || streams.length === 0) return streams;
    return streams.slice().sort(function(a, b) {
        return getQualityScore(b) - getQualityScore(a);
    });
}

function getResolutionScore(s) {
    var score = getQualityScore(s);
    return (score % 2 === 1) ? score - 1 : score;
}

function getLanguageGroup(s) {
    if (!s) return 'default';
    var text = ((s.title || '') + ' ' + (s.name || '')).toLowerCase();
    if (text.includes('dublaj') || text.includes('🇹🇷')) return 'dublaj';
    if (text.includes('altyazı') || text.includes('altyazi') || text.includes('sub') || text.includes('🌐')) return 'altyazi';
    return 'default';
}

function filterHighestQuality(streams) {
    if (!Array.isArray(streams) || streams.length <= 1) return streams;
    var groups = Object.create(null);
    for (var i = 0; i < streams.length; i++) {
        var s = streams[i];
        var grp = getLanguageGroup(s);
        if (!groups[grp]) groups[grp] = [];
        groups[grp].push(s);
    }

    var result = [];
    var groupKeys = Object.keys(groups);
    for (var k = 0; k < groupKeys.length; k++) {
        var grpStreams = groups[groupKeys[k]];
        var maxRes = 0;
        for (var j = 0; j < grpStreams.length; j++) {
            var res = getResolutionScore(grpStreams[j]);
            if (res > maxRes) maxRes = res;
        }
        if (maxRes === 0) {
            result = result.concat(grpStreams);
        } else {
            for (var j = 0; j < grpStreams.length; j++) {
                if (getResolutionScore(grpStreams[j]) >= maxRes) {
                    result.push(grpStreams[j]);
                }
            }
        }
    }
    return result;
}

module.exports = {
    getQualityScore,
    getResolutionScore,
    filterHighestQuality,
    sortStreamsByQuality
};
