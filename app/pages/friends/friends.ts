import {Component} from "@angular/core";
import {NavController, AlertController, LoadingController, ToastController} from "ionic-angular";
import {AppSettings} from "../../app-settings";
import {UserData} from "../../providers/user-data/user-data.provider";
import {Clipboard} from "ionic-native";
import {DomSanitizationService, SecurityContext} from "@angular/platform-browser";
import {Helper} from "../../providers/helper/helper.provider";
import {FriendCodePipe} from "../../pipes/friend-code.pipe";
import {TimestampDirective} from "../../directives/timestamp.directive";
import {FriendConversationPage} from "../friend-conversation/friend-conversation";
import {FriendsProvider} from "../../providers/firebase/friends.provider";

@Component({
  templateUrl: 'build/pages/friends/friends.html',
  directives: [TimestampDirective],
  providers: [FriendsProvider],
  pipes: [FriendCodePipe]
})
export class FriendsPage {

  constructor(private nav: NavController,
              private userData: UserData,
              private toastController: ToastController,
              private alertController: AlertController,
              private loadingController: LoadingController,
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
    this.loading = this.loadingController.create({dismissOnPageChange: true});
    this.loading.present();
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
        vm.toastController.create({message: 'Friend code copied to clipboard', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
      }, function () {
        vm.toastController.create({message: 'Friend code not copied - unable to access clipboard', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
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

        let addFriendPopup = vm.alertController.create({
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
                      vm.toastController.create({message: 'Success! <b>' + vm.sanitizer.sanitize(SecurityContext.HTML, vm.friendMemberObject.display_name) + '</b> has been added to your friends list.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
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
        addFriendPopup.present();

      }).catch(error => {
        vm.hideIonicLoading();
        if (error === AppSettings.ERROR.NONE) {
        } else if (error === AppSettings.ERROR.INET) {
          vm.toastController.create({message: 'An error occurred. Check your internet connection and try again.', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
        } else if (error === AppSettings.ERROR.DB_INTEGRITY) {
          vm.toastController.create({message: 'Database integrity error - this shouldn\'t happen. Please email us with the friend code you entered ASAP!', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
        } else if (error === AppSettings.ERROR.USER_NOT_FOUND) {
          vm.toastController.create({message: 'User not found - The friend code you entered is not tied to a user.', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
        } else if (error === AppSettings.ERROR.FRIEND_ALREADY_ADDED) {
          vm.toastController.create({message: 'Friend already added - this trainer is already in your friends list.', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
        } else {
          vm.toastController.create({message: 'An error occurred. Check your internet connection and try again.', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
        }
      });
    };

    let enterFriendCodePopup = vm.alertController.create({
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
              vm.toastController.create({message: 'Enter a valid 12-digit friend code', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
            } else if (vm.userData.getFriendCode() === data.targetFriendCode) {
              vm.toastController.create({message: 'You can\'t add yourself, you numpty.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
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
    enterFriendCodePopup.present();
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
      vm.alertController.create({title: 'Error', subTitle: 'Unable to retrieve friends. Check your internet connection and restart the app.', buttons: ['Dismiss']}).present();
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
