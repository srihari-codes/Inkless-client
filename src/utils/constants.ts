export const STORAGE_KEYS = {
  CURRENT_USER: "anonymous_messaging_current_user",
  ALL_USERS: "anonymous_messaging_all_users",
  ALL_MESSAGES: "anonymous_messaging_all_messages",
} as const;

export const ID_LENGTH = 6;
export const MAX_MESSAGE_LENGTH = 500;

// New cleanup configuration
export const CLEANUP_CONFIG = {
  IDLE_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes
  HEARTBEAT_INTERVAL_MS: 30 * 1000, // 30 seconds
  TAB_SWITCH_GRACE_MS: 30 * 1000, // 30 seconds
  EXISTENCE_CHECK_INTERVAL_MS: 60 * 1000, // 1 minute
} as const;
