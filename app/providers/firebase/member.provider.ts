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

  setMemberDetails(data: any) {
    var vm = this;
    return new Promise<any>((resolve, reject) => {
      firebase.database().ref('members/' + vm.userData.getId()).set(data).then(() => {
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  updateDisplayName(displayName: string) {
    var vm = this;
    var userId = vm.userData.getId();
    return new Promise<any>((resolve, reject) => {
      firebase.database().ref('members/' + userId + '/display_name').set(displayName).then(() => {
        vm.userData.setDisplayName(displayName);
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  updateTeam(team: string) {
    var vm = this;
    var userId = vm.userData.getId();
    return new Promise<any>((resolve, reject) => {
      firebase.database().ref('members/' + userId + '/team').set(team).then(() => {
        vm.userData.setTeam(team);
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  updateRadius(radius: number) {
    var vm = this;
    var userId = vm.userData.getId();
    return new Promise<any>((resolve, reject) => {
      firebase.database().ref('members/' + userId + '/radius').set(radius).then(() => {
        vm.userData.setRadius(radius);
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  // endregion

  // region Block List Functions
  /**
   * @description Retrieves a snapshot of a member's block list.
   * @returns {Promise<DataSnapshot>}
   */
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

  /**
   * @description Retrieves and snapshot of a member's block list
   * and transforms it into the form:
   * {'user_id': ...,
   *  'display_name': ...,
   *  'blocked_at': ...}
   * @returns {Promise<any>}
   */
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

  /**
   * @description Retrieves the block list from UserData and
   * checks whether the user ID is in it.
   * Traverses array in reverse due to likelihood of a message
   * belonging to a newly-blocked user being higher.
   * @param userId:string
   * @returns {boolean}
   */
  isUserIdInCachedBlockList(userId) {
    var blockList = this.userData.getBlockList();
    for (var i = blockList.length - 1; i >= 0; i--) {
      var blockListUser = blockList[i];
      if (blockListUser.user_id === userId) {
        return true;
      }
    }
    return false;
  }

  setBlockListUpdates(blockListUpdates, blockList) {
    var vm = this;
    return new Promise((resolve, reject) => {
      firebase.database().ref('block_list/' + vm.userData.getId()).update(blockListUpdates).then(() => {
        vm.userData.setBlockList(blockList);
        vm.userData.setIsBlockListStale(true);
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * @description Blocks a user, storing their display name and timestamp
   * @param userId:string
   * @param displayName:string
   * @returns {Promise<any>}
   */
  addUserToBlockList(userId, displayName) {
    var vm = this;
    return new Promise<any>((resolve, reject) => {
      firebase.database().ref('block_list/' + vm.userData.getId() + '/' + userId).set({
        'display_name': displayName,
        'blocked_at': firebase.database.ServerValue.TIMESTAMP
      }).then(() => {
        var blockList = vm.userData.getBlockList();
        blockList.push({'user_id': userId, 'display_name': displayName, 'blocked_at': Date.now()});
        vm.userData.setBlockList(blockList);
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  // endregion

  // region Friend Code Functions

  /**
   * @description Creates a friend code for the user in UserData.
   * Ensures that if the attempt exceeds AppSettings.CONFIG.MAX_FRIEND_CODE_GENERATION_ATTEMPTS,
   * the promise is rejected with an error.
   * @returns {Promise<void>}
   */
  createFriendCode() {
    var userId = this.userData.getId();

    var generateFriendCode = () => {
      var friendCode = '';
      for (var i = 0; i < 12; i++) {
        friendCode += Math.floor(Math.random() * 10).toString();
      }
      return friendCode;
    };

    return new Promise<void>((resolve, reject) => {
      var attemptCounter = 0;

      var setFriendCode = () => {
        var friendCode = generateFriendCode();

        firebase.database().ref('friend_codes/' + friendCode + '/user_id').set(userId).then(() => {
          return firebase.database().ref('members/' + userId + '/friend_code').set(friendCode);
        }).then(() => {
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

      setFriendCode();
    });
  }

  // endregion

}

