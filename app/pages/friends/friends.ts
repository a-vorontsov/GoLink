import {Component} from '@angular/core';
import {NavController, Alert, Loading} from 'ionic-angular';
import {AppSettings} from '../../app-settings';
import {UserData} from '../../providers/user-data/user-data.provider';
import {Clipboard, Toast} from 'ionic-native/dist/index';
import {DomSanitizationService, SecurityContext} from '@angular/platform-browser';
import {Helper} from '../../providers/helper/helper.provider';
import {FriendCodePipe} from '../../pipes/friend-code.pipe';
import {TimestampDirective} from '../../directives/timestamp.directive';
import {FriendConversationPage} from '../friend-conversation/friend-conversation';
import {FriendsProvider} from '../../providers/firebase/friends.provider';

@Component({
  templateUrl: 'build/pages/friends/friends.html',
  directives: [TimestampDirective],
  providers: [FriendsProvider],
  pipes: [FriendCodePipe]
})
export class FriendsPage {

  constructor(private nav: NavController,
              private userData: UserData,
              private friendsProvider: FriendsProvider,
              private helper: Helper,
              private sanitizer: DomSanitizationService) {
  }

  private loading;
  isLoading = true;
  data = {
    'friendCode': this.userData.getFriendCode(),
    'friends': []
  };

  /*
   * General helper functions
   */

  private showIonicLoading = () => {
    this.loading = Loading.create({dismissOnPageChange: true});
    this.nav.present(this.loading);
  };

  private hideIonicLoading = () => {
    if (this.loading) {
      setTimeout(() => {
        this.loading.dismiss();
      }, 300);
    }
  };

  private sortScopeDataFriends = () => {
    this.data.friends.sort(function (x, y) {
      return y.last_messaged - x.last_messaged;
    });
  };

  /*
   * View functions
   */

  copyFriendCode = () => {
    var vm = this;
    Clipboard
      .copy(vm.data.friendCode)
      .then(function () {
        Toast.showShortBottom('Friend code copied to clipboard');
      }, function () {
        Toast.showShortBottom('Friend code not copied - unable to access clipboard');
      });
  };

  navigateConversation = (friendId) => {
    this.nav.push(FriendConversationPage, {
      friendId: friendId
    });
  };

  /*
   * Adding friends
   */

  // Temporary variables
  private friendUserId;
  private friendMemberObject;

  showAddFriendPopup = () => {
    var vm = this;
    var addFriendByFriendCode = (targetFriendCode) => {

      // Show loading screen
      vm.showIonicLoading();

      // Retrieve the user ID of the friend code
      vm.friendsProvider.getProspectiveFriendByFriendCode(targetFriendCode, vm.data.friends).then(snapshot => {
        vm.friendUserId = snapshot.ref.key;
        vm.friendMemberObject = snapshot.val();
        vm.hideIonicLoading();

        let addFriendPopup = Alert.create({
          title: 'Add friend?',
          message: 'Do you want to add <b>' + vm.sanitizer.sanitize(SecurityContext.HTML, vm.friendMemberObject.display_name) + '</b> as a friend?',
          buttons: [
            {
              text: 'No',
              role: 'cancel',
              handler: () => {
                return true;
              }
            },
            {
              text: 'Yes',
              handler: () => {
                vm.showIonicLoading();
                vm.friendsProvider.addUserIdToFriendsList(vm.friendUserId).then(() => {
                  vm.data.friends.push({
                    'user_id': vm.friendUserId,
                    'display_name': vm.friendMemberObject.display_name,
                    'team': vm.friendMemberObject.team,
                    'last_messaged': null,
                    'added_at': Date.now()
                  });
                  this.loading.dismiss().then(() => {
                    addFriendPopup.dismiss().then(() => {
                      Toast.showShortBottom('Success! <b>' + vm.sanitizer.sanitize(SecurityContext.HTML, vm.friendMemberObject.display_name) + '</b> has been added to your friends list.');
                    });
                  });
                }).catch(error => {
                  addFriendPopup.dismiss().then(() => {
                    Promise.reject(AppSettings.ERROR.INET);
                  });
                });
                return false;
              }
            }
          ]
        });
        vm.nav.present(addFriendPopup);

      }).catch(error => {
        vm.hideIonicLoading();
        if (error === AppSettings.ERROR.NONE) {
        } else if (error === AppSettings.ERROR.INET) {
          Toast.showLongBottom('An error occurred. Check your internet connection and try again.');
        } else if (error === AppSettings.ERROR.DB_INTEGRITY) {
          Toast.showLongBottom('Database integrity error - this shouldn\'t happen. Please email us with the friend code you entered ASAP!');
        } else if (error === AppSettings.ERROR.USER_NOT_FOUND) {
          Toast.showLongBottom('User not found - The friend code you entered is not tied to a user.');
        } else if (error === AppSettings.ERROR.FRIEND_ALREADY_ADDED) {
          Toast.showLongBottom('Friend already added - this trainer is already in your friends list.');
        } else {
          Toast.showLongBottom('An error occurred. Check your internet connection and try again.');
        }
      });
    };

    let enterFriendCodePopup = Alert.create({
      title: 'Enter friend code',
      message: 'Enter a 12-digit friend code without hyphens (-) below.',
      inputs: [{name: 'targetFriendCode', placeholder: ''}],
      buttons: [
        {text: 'Cancel', role: 'cancel'},
        {
          text: 'Save',
          handler: data => {
            if (!data.targetFriendCode
              || data.targetFriendCode.length !== 12
              || !data.targetFriendCode.match(/^[0-9]+$/)) {
              Toast.showShortBottom('Enter a valid 12-digit friend code');
            } else if (vm.userData.getFriendCode() === data.targetFriendCode) {
              Toast.showShortBottom('You can\'t add yourself, you numpty.');
            } else {
              // Code passes validation check
              enterFriendCodePopup.dismiss().then(() => {
                addFriendByFriendCode(data.targetFriendCode);
                data.targetFriendCode = '';
              });
            }
            return false;
          }
        }
      ]
    });
    vm.nav.present(enterFriendCodePopup);
  };

  /*
   * Getting list of friends
   */

  updateFriendList() {
    var vm = this;
    var getFriendObjectPromises = [];
    var conversationIds = [];
    var friends;
    vm.friendsProvider.getFriendsList().then(tempFriends => {
      friends = tempFriends;

      // Add initial list of friends to array and get further information about each friend
      for (var friendUserId in friends) {
        var friend = friends[friendUserId];
        vm.data.friends.push({'user_id': friendUserId, 'added_at': friend.added_at});
        getFriendObjectPromises.push(vm.friendsProvider.getFriendObjectPromise(friendUserId));
        conversationIds.push(vm.helper.getConversationIdByFriendId(friendUserId));
      }

      // Execute all promises
      return Promise.all(getFriendObjectPromises);
    }).then(results => {
      results.forEach(function (result) {
        for (var i = 0; i < vm.data.friends.length; i++) {
          if (vm.data.friends[i].user_id === result.user_id) {
            vm.data.friends[i].display_name = result.display_name;
            vm.data.friends[i].friend_code = result.friend_code;
            vm.data.friends[i].team = result.team;
            break;
          }
        }
      });

      for (var conversationId of conversationIds) {
        // Listen for timestamp updates
        vm.friendsProvider.getLastMessageRefByConversationId(conversationId).on('value', snapshot => {
          var friendId = vm.helper.getFriendUserIdFromConversationId(snapshot.ref.parent.key);
          var lastMessaged = snapshot.val();
          for (var i = 0; i < vm.data.friends.length; i++) {
            if (vm.data.friends[i].user_id === friendId) {
              setTimeout(function () {
                if (typeof(lastMessaged) === undefined || lastMessaged === null) {
                  vm.data.friends[i].last_messaged = 0;
                } else {
                  vm.data.friends[i].last_messaged = (lastMessaged >= Date.now()) ? Date.now() - 1 : lastMessaged;
                }
                vm.sortScopeDataFriends();
              });
              break;
            }
          }
        });
      }

      setTimeout(function () {
        vm.userData.setFriends(vm.data.friends);
        vm.isLoading = false;
      });
    }).catch(error => {
      vm.nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve friends. Check your internet connection and restart the app.', buttons: ['Dismiss']}));
    });
  };

  ionViewLoaded() {
    this.updateFriendList();
  };

  ionViewDidEnter() {
    if (this.userData.getIsFriendListStale()) {
      this.updateFriendList();
    }
  };

}
