export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;
export const MS_PER_HOUR = MINUTES_PER_HOUR * MS_PER_MINUTE;
export const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;

/**
 * Operational fallback timezone for server-formatted, recipient-facing date/
 * time text (notification bodies, email templates) where the recipient's own
 * timezone isn't available on the payload yet — explicit rather than relying
 * on the Node runtime's ambient default (implementation-defined, and not
 * reliably UTC on a container host). NOT a substitute for real
 * per-recipient timezone formatting once a payload actually carries one — see
 * docs/global-readiness/state.md's Chunk 4 notes for the versioned-payload
 * path to that.
 */
export const DEFAULT_OPERATIONAL_TIMEZONE = 'UTC';
