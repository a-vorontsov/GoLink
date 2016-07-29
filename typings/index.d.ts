/// <reference path="app-settings.d.ts" />
/// <reference path="globals/es6-shim/index.d.ts" />
/// <reference path="manual/firebase3.d.ts" />

declare var moment: any;
declare var GeoFire: any;
declare var uuid: any;

interface PublicConversationUser {
  user_id: string;
  display_name: string;
  team: string;
}

interface PublicConversationMessage {
  uuid: string;
  user: PublicConversationUser;
  timestamp: any;
  message?: string;
  latitude?: number;
  longitude?: number;
}
