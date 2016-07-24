import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';
import {AppSettings} from '../../app-settings';
import DataSnapshot = firebase.database.DataSnapshot;

@Injectable()
export class MemberProvider {

  constructor(private userData: UserData) {

  }

  // region Member Functions

  getMemberSnapshot() {
    var userId = this.userData.getId();
    return new Promise<DataSnapshot>((resolve, reject) => {
      firebase.database().ref('/members/' + userId).once('value').then(snapshot => {
        resolve(snapshot);
      }).catch(error => {
        reject(error);
      });
    });
  }

  getMemberObject() {
    return new Promise<any>((resolve, reject) => {
      this.getMemberSnapshot().then(snapshot => {
        resolve(snapshot.val());
      }).catch(error => {
        reject(error);
      });
    });
  }

  getUserStatusFromMemberSnapshot(snapshot): number {
    if (snapshot.exists()
      && snapshot.hasChild('display_name') && snapshot.hasChild('radius') && snapshot.hasChild('team')
      && snapshot.hasChild('friend_code') && snapshot.child('friend_code').val().length === AppSettings.CONFIG['FRIEND_CODE_LENGTH']) {
      return AppSettings.INFO.USER_OK;
    } else if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('radius') && snapshot.hasChild('team')) {
      return AppSettings.INFO.USER_NEEDS_FRIEND_CODE;
    } else {
      return AppSettings.INFO.USER_NEEDS_SETUP;
    }
  }

  // endregion

  // region Block List Functions
  getBlockListSnapshot() {
    var userId = this.userData.getId();
    return new Promise<DataSnapshot>((resolve, reject) => {
      firebase.database().ref('block_list/' + userId).once('value').then(snapshot => {
        resolve(snapshot);
      }).catch(error => {
        reject(error);
      });
    });
  }

  getTransformedBlockListObject() {
    return new Promise<any>((resolve, reject) => {
      this.getBlockListSnapshot().then(snapshot => {
        var blockList = snapshot.val();
        var transformedBlockList = [];
        for (var key in blockList) {
          transformedBlockList.push({
            'user_id': key,
            'display_name': blockList[key].display_name,
            'blocked_at': blockList[key].blocked_at
          });
        }
        resolve(transformedBlockList);
      }).catch(error => {
        reject(error);
      });
    });
  }

  // endregion

  // region Friend Code Functions

  createFriendCode() {
    var userId = this.userData.getId();

    var generateFriendCode = () => {
      var friendCode = '';
      for (var i = 0; i < 12; i++) {
        friendCode += Math.floor(Math.random() * 10).toString();
      }
      return friendCode;
    };

    return new Promise((resolve, reject) => {
      var attemptCounter = 0;
      var friendCode = generateFriendCode;

      var setFriendCode = () => {
        var rootRef = firebase.database().ref('');
        var updatedData = {};
        updatedData['friend_codes/' + friendCode + 'user_id'] = userId;
        updatedData['members/' + userId + '/friend_code'] = friendCode;
        rootRef.update(updatedData).then(() => {
          resolve();
        }).catch(error => {
          attemptCounter++;
          if (attemptCounter < AppSettings.CONFIG.MAX_FRIEND_CODE_GENERATION_ATTEMPTS) {
            setFriendCode();
          } else {
            reject(error);
          }
        });
      };
    });
  }

  // endregion

}

