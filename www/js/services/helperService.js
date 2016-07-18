angular.module('app.services')
  .service('helperService', function () {
    this.getConversationId = function (userId, friendUserId) {
      if (userId < friendUserId) {
        return userId + '+' + friendUserId;
      } else {
        return friendUserId + '+' + userId;
      }
    };

    this.getFriendUserIdFromConversationId = function (userId, conversationId) {
      return conversationId.replace(userId, '').replace('+', '');
    };
  });
