const CONNECTIVITY_PATTERN = /\b(50[234])\b|gateway|timeout|fetch failed|network request failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i;

// Denylisting specific technical strings doesn't scale — every provider
// (Apple, Google, Supabase, Postgres) has its own vocabulary for internal
// errors, and a new one always finds a gap (e.g. "Unacceptable audience in
// id_token: [host.exp.Exponent]" from Apple Sign-In slipped straight through
// the old version of this function). Allowlisting instead: only messages
// that look like plain, short, human-written sentences pass through
// unchanged; anything that looks technical falls back to a caller-supplied,
// context-appropriate message instead.
const TECHNICAL_PATTERN = /\b(token|audience|jwt|stack ?trace|exception|null|undefined|constraint|violates|duplicate key|row-level security|permission denied for|syntax error|relation "|sql|nspname|pg_)\b|function\s*\(|\w+\(\)/i;

export function cleanErr(e: any, fallback = "Something went wrong. Please try again."): string {
    const msg: string = (e?.message ?? e?.details ?? String(e ?? "")).trim();

    if (!msg) return fallback;
    if (CONNECTIVITY_PATTERN.test(msg)) {
        return "Connection error. Please check your internet and try again.";
    }
    if (msg.startsWith("{") || msg.startsWith("[") || msg.length > 160 || TECHNICAL_PATTERN.test(msg)) {
        return fallback;
    }
    return msg;
}
