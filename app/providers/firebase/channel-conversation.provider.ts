import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';
import Reference = firebase.database.Reference;
import DataSnapshot = firebase.database.DataSnapshot;

@Injectable()
export class ChannelConversationProvider {

  constructor(private userData: UserData) {
  }

  getMessagesForChannel(channelId) {
    var vm = this;
    return new Promise((resolve, reject) => {
      firebase.database().ref('channels/' + channelId + '/messages').once('value').then((snapshot) => {
        resolve(snapshot.val());
      }).catch(error => {
        reject(error);
      });
    });
  }

  getNewMessageRefByChannelId(channelId): Reference {
    return firebase.database().ref('channels/' + channelId + '/messages').push();
  }

  addMessageToChannel(channelId, key, data) {
    return new Promise((resolve, reject) => {
      var updatedMessageData = {};
      updatedMessageData[channelId + '/messages/' + key] = data;
      updatedMessageData[channelId+ '/last_messaged'] = firebase.database.ServerValue.TIMESTAMP;
      firebase.database().ref('channels').update(updatedMessageData).then(() => {
        resolve();
      }).catch(error => {
        reject();
      });
    });
  }

  removeMessageFromConversation(channelId, key) {
    return new Promise((resolve, reject) => {
      firebase.database().ref('channels/' + channelId + '/messages/' + key).remove().then(() => {
        resolve();
      }).catch(error => {
        reject();
      });
    });
  }

  getChildAddedListenerReference(channelId, messages) {
    if (messages.length > 0) {
      return firebase.database().ref('channels/' + channelId + '/messages').orderByKey().startAt(messages[messages.length - 1].key);
    } else {
      return firebase.database().ref('channels/' + channelId + '/messages').orderByKey();
    }
  }

}
