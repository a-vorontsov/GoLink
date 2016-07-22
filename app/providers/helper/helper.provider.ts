import {Injectable} from '@angular/core';

@Injectable()
export class Helper {
  getConversationId(userId, friendUserId) {
    if (userId < friendUserId) {
      return userId + '+' + friendUserId;
    } else {
      return friendUserId + '+' + userId;
    }
  }

  getFriendUserIdFromConversationId(userId, conversationId) {
    return conversationId.replace(userId, '').replace('+', '');
  }
}
