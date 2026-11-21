// MUM modification 2026-11-22. GPL-3.0-only; see LICENSE and NOTICE.md.

/**
 * Standard provider diagnostic error.
 * Encapsulates error code, execution stage, and safe status.
 * Never stores raw URLs, auth tokens, or sensitive response bodies.
 */
function ProviderError(code, message, stage, status) {
  var err = new Error(message || code);
  err.name = 'ProviderError';
  err.code = code;     // 'HTTP_BLOCKED' | 'HTTP_ERROR' | 'NO_MATCH' | 'PARSE_ERROR' | 'TMDB_ERROR' | 'NETWORK_ERROR'
  err.stage = stage;   // 'tmdb' | 'search' | 'details' | 'matching' | 'player'
  err.status = status; // 403, 500 etc. if applicable
  Object.setPrototypeOf(err, ProviderError.prototype);
  return err;
}
ProviderError.prototype = Object.create(Error.prototype);
ProviderError.prototype.constructor = ProviderError;

module.exports = {
  ProviderError: ProviderError
};
