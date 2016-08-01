import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';
import Reference = firebase.database.Reference;
import {AppSettings} from '../../app-settings';

@Injectable()
export class FriendConversationProvider {

  constructor(private userData: UserData) {
  }

  getMessagesForFriendConversation(friendId, conversationId) {
    var vm = this;
    return new Promise((resolve, reject) => {
      firebase.database().ref('members/' + friendId + '/friends/' + vm.userData.getId()).once('value').then((snapshot) => {
        if (!(snapshot.exists() && snapshot.hasChild('added_at'))) {
          reject(AppSettings.ERROR.FRIEND_NOT_ADDED);
        }
        return firebase.database().ref('friend_conversations/' + conversationId + '/messages').once('value');
      }).then((snapshot) => {
        resolve(snapshot.val());
      }).catch(error => {
        reject(error);
      });
    });
  }

  getNewMessageRefByConversationId(conversationId): Reference {
    return firebase.database().ref('friend_conversations/' + conversationId + '/messages').push();
  }

  addMessageToConversation(conversationId, key, data) {
    return new Promise((resolve, reject) => {
      var updatedMessageData = {};
      updatedMessageData[conversationId + '/messages/' + key] = data;
      updatedMessageData[conversationId + '/last_messaged'] = firebase.database.ServerValue.TIMESTAMP;
      firebase.database().ref('friend_conversations').update(updatedMessageData).then(() => {
        resolve();
      }).catch(error => {
        reject();
      });
    });
  }

  removeMessageFromConversation(conversationId, key) {
    return new Promise((resolve, reject) => {
      firebase.database().ref('friend_conversations/' + conversationId + '/messages/' + key).remove().then(() => {
        resolve();
      }).catch(error => {
        reject();
      });
    });
  }

  getChildAddedListenerReference(conversationId, messages) {
    if (messages.length > 0) {
      return firebase.database().ref('friend_conversations/' + conversationId + '/messages').orderByKey().startAt(messages[messages.length - 1].key);
    } else {
      return firebase.database().ref('friend_conversations/' + conversationId + '/messages').orderByKey();
    }
  }

}
