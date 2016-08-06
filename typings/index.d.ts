/// <reference path="app-settings.d.ts" />
/// <reference path="globals/es6-shim/index.d.ts" />
/// <reference path="manual/firebase3.d.ts" />

declare var moment: any;
declare var GeoFire: any;
declare var uuid: any;

interface ConversationUser {
  user_id: string;
  display_name: string;
  team: string;
}

interface PublicConversationMessage {
  uuid: string;
  user: ConversationUser;
  timestamp: any;
  message?: string;
  latitude?: number;
  longitude?: number;
}

interface FriendConversationMessage {
  uuid: string;
  timestamp: any;
  message?: string;
  latitude?: number;
  longitude?: number;
}

interface ChannelConversationMessage {
  uuid: string;
  user: ConversationUser;
  timestamp: any;
  is_joined: boolean;
  message?: string;
  latitude?: number;
  longitude?: number;
}
