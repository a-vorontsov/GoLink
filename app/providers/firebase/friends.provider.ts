import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';
import {AppSettings} from '../../app-settings';
import DataSnapshot = firebase.database.DataSnapshot;

@Injectable()
export class FriendsProvider {

  constructor(private userData: UserData) {
  }

  getProspectiveFriendByFriendCode(friendCode, friendsList) {
    var vm = this;
    return new Promise<DataSnapshot>((resolve, reject) => {
      // Retrieve the user ID of the friend code
      firebase.database().ref('/friend_codes/' + friendCode).once('value').then(snapshot => {
        // Check whether the user ID for this snapshot exists
        if (!(snapshot.exists() && snapshot.hasChild('user_id'))) {
          reject(AppSettings.ERROR.USER_NOT_FOUND);
        }

        // Retrieve the member details for the user ID
        var friendUserId = snapshot.child('user_id').val();
        if (friendUserId === vm.userData.getId()) {
          reject(AppSettings.ERROR.DB_INTEGRITY);
        }

        for (var i = 0; i < friendsList.length; i++) {
          var friend = friendsList[i];
          if (friendUserId === friend.user_id) {
            reject(AppSettings.ERROR.FRIEND_ALREADY_ADDED);
          }
        }

        return firebase.database().ref('/members/' + friendUserId).once('value');
      }).then(snapshot => {
        // Check whether the display name exists for this snapshot
        if (!(snapshot.exists() && snapshot.hasChild('display_name'))) {
          reject(AppSettings.ERROR.DB_INTEGRITY);
        }

        resolve(snapshot);
      });
    });
  }

  addUserIdToFriendsList(friendId) {
    var vm = this;
    return new Promise<any>((resolve, reject) => {
      firebase.database().ref('members/' + vm.userData.getId() + '/friends/' + friendId).set({'added_at': firebase.database.ServerValue.TIMESTAMP}).then(() => {
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  getLastMessageRefByConversationId(conversationId) {
    return firebase.database().ref('friend_conversations/' + conversationId + '/last_messaged');
  }

  getFriendObjectPromise(friendId) {
    return firebase.database().ref('members/' + friendId).once('value').then(function (snapshot) {
      var friend = snapshot.val();
      friend.user_id = friendId;
      return friend;
    });
  }

  getFriendsList() {
    var vm = this;
    return new Promise((resolve, reject) => {
      firebase.database().ref('members/' + vm.userData.getId() + '/friends').once('value').then((snapshot) => {
        resolve(snapshot.val());
      }).catch(error => {
        reject(error);
      });
    });
  }

  removeFriendFromFriendsList(friendId) {
    var vm = this;
    return new Promise((resolve, reject) => {
      firebase.database().ref('members/' + vm.userData.getId() + '/friends/' + friendId).remove(() => {
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

}
