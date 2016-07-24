interface CONFIG {
  FRIEND_CODE_LENGTH: number;
  MAX_FRIEND_CODE_GENERATION_ATTEMPTS: number;
  MAX_DISPLAY_NAME_LENGTH: number;
  MAX_MESSAGE_LENGTH: number;
  MAX_GEOLOCATION_TIME: number;
}

interface INFO {
  USER_OK: number;
  USER_NEEDS_SETUP: number;
  USER_NEEDS_FRIEND_CODE: number;
}

interface ERROR {
  NONE: number;
  INET: number;
  DB_INTEGRITY: number;
  USER_NOT_AUTHENTICATED: number;
  USER_NOT_FOUND: number;
  FRIEND_ALREADY_ADDED: number;
  FRIEND_NOT_ADDED: number;
}
