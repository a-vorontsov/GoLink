import {Component} from "@angular/core";
import {NavController, Alert, Loading} from "ionic-angular";
import {AppSettings} from "../../app-settings";
import {UserData} from "../../providers/user-data/user-data.provider";
import {Clipboard, Toast} from "ionic-native/dist/index";
import {DomSanitizationService, SecurityContext} from "@angular/platform-browser";
import {Helper} from "../../providers/helper/helper.provider";
import {FriendCodePipe} from "../../pipes/friend-code.pipe";
import {TimestampDirective} from "../../directives/timestamp.directive";
import {FriendConversationPage} from "../friend-conversation/friend-conversation";

/*
 Generated class for the FriendsPage page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  templateUrl: 'build/pages/friends/friends.html',
  directives: [TimestampDirective],
  pipes: [FriendCodePipe]
})
export class FriendsPage {

  constructor(private nav:NavController,
              private userData:UserData,
              private helper:Helper,
              private sanitizer:DomSanitizationService) {
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

  showIonicLoading = () => {
    this.loading = Loading.create({dismissOnPageChange: true});
    this.nav.present(this.loading);
  };

  hideIonicLoading = () => {
    if (this.loading) {
      this.loading.dismiss();
    }
  };

  sortScopeDataFriends = () => {
    this.data.friends.sort(function (x, y) {
      return y.last_messaged - x.last_messaged;
    });
  };

  copyFriendCode = function () {
    var vm = this;
    Clipboard
      .copy(vm.userData.getFriendCode())
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

  showAddFriendPopup = function () {
    var addFriendByFriendCode = (targetFriendCode) => {
      var vm = this;

      // Show loading screen
      vm.showIonicLoading();

      // Retrieve the user ID of the friend code
      firebase.database().ref('/friend_codes/' + targetFriendCode).once('value')
        .then(function getMemberDetailsFromFriendCodeSnapshot(snapshot) {
          // Check whether the user ID for this snapshot exists
          if (!(snapshot.exists() && snapshot.hasChild('user_id'))) {
            return Promise.reject(AppSettings.ERROR['USER_NOT_FOUND']);
          }

          // Retrieve the member details for the user ID
          vm.friendUserId = snapshot.child('user_id').val();
          if (vm.friendUserId == vm.userData.getId()) {
            return Promise.reject(AppSettings.ERROR['DB_INTEGRITY']);
          }

          for (var i = 0; i < vm.data.friends.length; i++) {
            var friend = vm.data.friends[i];
            if (vm.friendUserId == friend.user_id) {
              return Promise.reject(AppSettings.ERROR['FRIEND_ALREADY_ADDED']);
            }
          }

          return firebase.database().ref('/members/' + vm.friendUserId).once('value');

        }).then(function getFriendMemberSnapshot(snapshot) {
        // Check whether the display name exists for this snapshot
        if (!(snapshot.exists() && snapshot.hasChild('display_name'))) {
          return Promise.reject(AppSettings.ERROR['DB_INTEGRITY']);
        }

        vm.friendMemberObject = snapshot.val();
        vm.hideIonicLoading();

        vm.nav.present(Alert.create({
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
                firebase.database().ref('members/' + vm.userData.getId() + '/friends/' + vm.friendUserId).set({'added_at': firebase.database.ServerValue.TIMESTAMP})
                  .then(function onGetFriendInfo(error) {
                    if (error) {
                      return Promise.reject(AppSettings.ERROR['INET']);
                    }
                    vm.data.friends.push({
                      'user_id': vm.friendUserId,
                      'display_name': vm.friendMemberObject.display_name,
                      'team': vm.friendMemberObject.team,
                      'last_messaged': null,
                      'added_at': Date.now()
                    });
                    vm.hideIonicLoading();
                    Toast.show('Success! <b>' + vm.sanitizer.sanitize(SecurityContext.HTML, vm.friendMemberObject.display_name) + '</b> has been added to your friends list.', "3000", "bottom");
                  });
                return;
              }
            }
          ]
        }));

      }, function (error) {
        vm.hideIonicLoading();
        if (error === AppSettings.ERROR['NONE']) {
        } else if (error === AppSettings.ERROR['INET']) {
          Toast.showLongBottom('An error occurred. Check your internet connection and try again.');
        } else if (error === AppSettings.ERROR['DB_INTEGRITY']) {
          Toast.showLongBottom('Database integrity error - this shouldn\'t happen. Please email us with the friend code you entered ASAP!');
        } else if (error === AppSettings.ERROR['USER_NOT_FOUND']) {
          Toast.showLongBottom('User not found - The friend code you entered is not tied to a user.');
        } else if (error === AppSettings.ERROR['FRIEND_ALREADY_ADDED']) {
          Toast.showLongBottom('Friend already added - this trainer is already in your friends list.');
        } else {
          Toast.showLongBottom('An error occurred. Check your internet connection and try again.');
        }
      });
    };

    var vm = this;
    vm.nav.present(Alert.create({
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
              Toast.showShortBottom("Enter a valid 12-digit friend code");
              return false;
            } else if (vm.userData.getFriendCode() === data.targetFriendCode) {
              Toast.showShortBottom("You can't add yourself, you numpty.");
              return false;
            } else {
              // Code passes validation check
              addFriendByFriendCode(data.targetFriendCode);
              data.targetFriendCode = '';
              return true;
            }
          }
        }
      ]
    }));
  };

  /*
   * Getting list of friends
   */

  getFriendObjectPromise = (friendId) => {
    return firebase.database().ref('members/' + friendId).once('value').then(function (snapshot) {
      var friend = snapshot.val();
      friend.user_id = friendId;
      return friend;
    });
  };

  getLastMessagedSnapshotPromise = (conversationId) => {
    return firebase.database().ref('friend_conversations/' + conversationId + '/last_messaged').once('value').then(function (snapshot) {
      return snapshot;
    });
  };

  updateFriendList() {
    var vm = this;
    firebase.database().ref('members/' + vm.userData.getId() + '/friends').once('value').then(function (snapshot) {
      // Add initial list of friends to array and get further information about each friend
      var friends = snapshot.val();
      var getFriendObjectPromises = [];
      var getLastMessagedPromises = [];
      for (var friendUserId in friends) {
        var friend = friends[friendUserId];
        vm.data.friends.push({'user_id': friendUserId, 'added_at': friend.added_at});
        getFriendObjectPromises.push(vm.getFriendObjectPromise(friendUserId));
        getLastMessagedPromises.push(vm.getLastMessagedSnapshotPromise(vm.helper.getConversationId(vm.userData.getId(), friendUserId)));
      }

      // Execute all promises
      Promise.all(getFriendObjectPromises).then(function onGetFriendObjectPromisesComplete(results) {
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

        return Promise.all(getLastMessagedPromises);
      }).then(function onGetLastMessagedPromisesComplete(results) {
        for (var result of results) {
          // Listen for timestamp updates
          firebase.database().ref('friend_conversations/' + result.ref.parent.key + '/last_messaged').on('value', function (snapshot) {
            var friendId = vm.helper.getFriendUserIdFromConversationId(vm.userData.getId(), snapshot.ref.parent.key);
            var lastMessaged = snapshot.val();
            for (var i = 0; i < vm.data.friends.length; i++) {
              if (vm.data.friends[i].user_id === friendId) {
                setTimeout(function () {
                  if (typeof(lastMessaged) === undefined || lastMessaged === null) {
                    vm.data.friends[i].last_messaged = 0;
                  } else {
                    vm.data.friends[i].last_messaged = (lastMessaged >= Date.now()) ? Date.now() - 1 : lastMessaged;
                  }
                });
                break;
              }
            }
            vm.sortScopeDataFriends();
          });
        }

        setTimeout(function () {
          vm.userData.setFriends(vm.data.friends);
          vm.isLoading = false;
        });
      }, function (error) {
        vm.nav.present(Alert.create({title: "Error", subTitle: "Unable to retrieve friends. Check your internet connection and restart the app.", buttons: ['Dismiss']}));
      });

    }, function (error) {
      if (error) {
        vm.nav.present(Alert.create({title: "Error", subTitle: "Unable to retrieve friends. Check your internet connection and restart the app.", buttons: ['Dismiss']}));
      }
    });
  };

  ionViewLoaded() {
    this.updateFriendList();
  };

  ionViewWillEnter() {
    if (this.userData.getIsFriendListStale()) {
      this.updateFriendList();
    }
  };

}
