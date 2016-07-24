export class AppSettings {
  public static get CONFIG():Object {
    return {
      FRIEND_CODE_LENGTH: 12,
      MAX_FRIEND_CODE_GENERATION_ATTEMPTS: 10,
      MAX_DISPLAY_NAME_LENGTH: 16,
      MAX_MESSAGE_LENGTH: 1000
    };
  }

  public static get INFO():Object {
    return {
      USER_OK: 0,
      USER_NEEDS_SETUP: 1,
      USER_NEEDS_FRIEND_CODE: 2
    }
  }

  public static get ERROR():Object {
    return {
      NONE: 0,
      INET: 1,
      DB_INTEGRITY: 2,
      USER_NOT_AUTHENTICATED: 3,
      USER_NOT_FOUND: 4,
      FRIEND_ALREADY_ADDED: 5,
      FRIEND_NOT_ADDED: 6
    };
  }
}
