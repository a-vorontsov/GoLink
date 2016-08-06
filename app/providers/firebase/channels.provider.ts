import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';
import {UUID} from 'angular2-uuid';

@Injectable()
export class ChannelsProvider {

  constructor(private userData: UserData) {
  }

  joinChannel(channelId) {
    var vm = this;
    return new Promise((resolve, reject) => {
      var userId = vm.userData.getId();
      firebase.database().ref('channels/' + channelId + '/members/' + userId + '/joined_at').set(firebase.database.ServerValue.TIMESTAMP).then(() => {
        return firebase.database().ref('members/' + userId + '/channels/' + channelId + '/joined_at').set(firebase.database.ServerValue.TIMESTAMP);
      }).then(() => {
        return firebase.database().ref('channels/' + channelId + '/messages').push({
          'uuid': UUID.UUID(),
          'user': {
            'user_id': vm.userData.getId(),
            'display_name': vm.userData.getDisplayName(),
            'team': vm.userData.getTeam()
          },
          'timestamp': firebase.database.ServerValue.TIMESTAMP,
          'is_joined': true
        });
      }).then(() => {
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  getChannels() {
    var vm = this;
    return new Promise((resolve, reject) => {
      firebase.database().ref('members/' + vm.userData.getId() + '/channels').once('value').then((snapshot) => {
        resolve(snapshot.val());
      }).catch(error => {
        reject(error);
      });
    });
  }

  getLastMessageRefByChannelId(channelId) {
    return firebase.database().ref('channels/' + channelId + '/last_messaged');
  }

}
