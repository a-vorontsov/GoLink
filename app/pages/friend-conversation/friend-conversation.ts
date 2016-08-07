import {Component, ViewChild} from "@angular/core";
import {NavController, Content, Platform, NavParams, ActionSheetController, AlertController, LoadingController} from "ionic-angular";
import {UserData} from "../../providers/user-data/user-data.provider";
import {Helper} from "../../providers/helper/helper.provider";
import {UUID} from "angular2-uuid/index";
import {Toast, Clipboard} from "ionic-native";
import {AppSettings} from "../../app-settings";
import {TimestampPipe} from "../../pipes/timestamp.pipe";
import {TimestampDirective} from "../../directives/timestamp.directive";
import {FriendsPage} from "../friends/friends";
import {FriendConversationProvider} from "../../providers/firebase/friend-conversation.provider";
import {FriendsProvider} from "../../providers/firebase/friends.provider";
import {NativeProvider} from "../../providers/native-provider/native-provider";

@Component({
  templateUrl: 'build/pages/friend-conversation/friend-conversation.html',
  pipes: [TimestampPipe],
  directives: [TimestampDirective],
  providers: [FriendConversationProvider, FriendsProvider, NativeProvider]
})
export class FriendConversationPage {

  constructor(private nav: NavController,
              private params: NavParams,
              private userData: UserData,
              private alertController: AlertController,
              private actionSheetController: ActionSheetController,
              private loadingController: LoadingController,
              private nativeProvider: NativeProvider,
              private friendsProvider: FriendsProvider,
              private friendConversationProvider: FriendConversationProvider,
              private helper: Helper,
              private platform: Platform) {
    this.friendId = this.params.get('friendId');
    this.conversationId = this.helper.getConversationIdByFriendId(this.friendId);
  };

  @ViewChild(Content) content: Content;

  isLoading = true;
  isInFriendsList = false;
  isConnectedToFriend = true;
  data = {
    'message': '',
    'messages': [],
    'friend': {
      'user_id': this.friendId,
      'display_name': null,
      'team': null
    }
  };

  protected friendId;
  protected conversationId;
  protected sentMessageKeys = [];
  protected userId = this.userData.getId();

  sendConversationMessageWithData = (data: FriendConversationMessage) => {
    var vm = this;
    // Create a message
    var newMessageRef = vm.friendConversationProvider.getNewMessageRef(vm.conversationId);
    vm.sentMessageKeys.push(newMessageRef.key);

    var messages = vm.data.messages;
    for (var i = messages.length - 1; i >= 0; i--) {
      var message = messages[i];
      if (message.uuid === data.uuid && message.key === '') {
        message.key = newMessageRef.key;
        vm.data.messages[i] = message;
        break;
      }
    }

    // Set the message
    vm.friendConversationProvider.addMessage(vm.conversationId, newMessageRef.key, data);
  };

  addLocalMessageToScope = (data) => {
    var vm = this;
    vm.data.messages.push({
      'uuid': data.uuid,
      'key': '',
      'distance': 0,
      'timestamp': Date.now(),
      'type': data.type,
      'message': data.message,
      'latitude': vm.userData.getLatitude(),
      'longitude': vm.userData.getLongitude(),
      'geo_uri': vm.helper.getGeoUriFromCoordinates(vm.userData.getLatitude(), vm.userData.getLongitude()),
      'geo_src': vm.helper.getSrcfromCoordinates(vm.userData.getLatitude(), vm.userData.getLongitude()),
      'user': {
        'is_me': true
      }
    });
    vm.content.scrollToBottom(300);
  };

  private loading;
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

  // region Ionic View Events

  ionViewDidEnter() {
    setTimeout(() => {
      this.content.scrollToBottom(300);
    });
  }

  ionViewLoaded() {
    var vm = this;

    // Check whether the friend is in the friends list
    var friends = vm.userData.getFriends();
    for (var i = 0; i < friends.length; i++) {
      var friend = friends[i];
      if (vm.friendId === friend.user_id) {
        vm.isInFriendsList = true;
        vm.data.friend.display_name = friend.display_name;
        vm.data.friend.team = friend.team;
        break;
      }
    }

    if (!vm.isInFriendsList) {
      vm.isLoading = false;
      return;
    }

    vm.friendConversationProvider.getMessages(vm.friendId, vm.conversationId).then((messages) => {
      // Populate the list of messages
      for (var key in messages) {
        var message = messages[key];
        vm.data.messages.push({
          'key': key,
          'timestamp': message.timestamp,
          'type': typeof(message.longitude) === 'undefined' ? 'message' : 'location',
          'message': message.message,
          'longitude': message.longitude,
          'latitude': message.latitude,
          'geo_uri': vm.helper.getGeoUriFromCoordinates(message.latitude, message.longitude),
          'geo_src': vm.helper.getSrcfromCoordinates(message.latitude, message.longitude),
          'user': {
            'user_id': message.user_id,
            'is_me': message.user_id === vm.userId
          }
        });
      }
      setTimeout(() => {
        vm.isLoading = false;
        vm.content.scrollToBottom(300);
      });
      vm.listenForNewMessages();
    }).catch(function (error) {
      setTimeout(() => {
        if (error === AppSettings.ERROR.FRIEND_NOT_ADDED) {
          setTimeout(() => {
            vm.isConnectedToFriend = false;
            vm.isLoading = false;
          });
        } else {
          vm.alertController.create({title: 'Error', subTitle: 'Unable to retrieve messages. Check your internet connection and restart the app.', buttons: ['Dismiss']}).present();
        }
      });
    });
  }

  showActionSheet = () => {
    var vm = this;

    function showRemoveDialog() {
      vm.alertController.create({
        title: 'Remove friend?',
        message: 'You will need their friend code to add them again in the future.',
        buttons: [
          {
            text: 'No',
            role: 'cancel'
          },
          {
            text: 'Yes',
            handler: () => {
              vm.showIonicLoading();
              vm.friendsProvider.removeFriendFromFriendsList(vm.friendId).then(() => {
                vm.hideIonicLoading();
                vm.userData.setIsFriendListStale(true);
                Toast.showShortBottom('The trainer has been removed from your friends list.');
                vm.nav.setRoot(FriendsPage);
              }).catch(error => {
                vm.hideIonicLoading();
                Toast.showLongBottom('Unable to remove friend - Check your internet connection and try again later.');
              });
            }
          }
        ]
      }).present();
    }

    let actionSheet = vm.actionSheetController.create({
      buttons: [
        {
          text: 'Remove Friend',
          role: 'destructive',
          icon: (vm.platform.is('ios')) ? undefined : 'trash',
          handler: () => {
            actionSheet.dismiss().then(() => {
              showRemoveDialog();
            });
            return false;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: (vm.platform.is('ios')) ? undefined : 'close'
        }
      ]
    });
    actionSheet.present();
  };

  onMessageClicked = (message) => {
    var vm = this;

    let actionSheetOpts = {title: 'Message Actions', buttons: []};
    // Copy button
    if (message.type === 'message') {
      actionSheetOpts.buttons.push({
        text: 'Copy text',
        icon: (vm.platform.is('ios')) ? undefined : 'copy',
        handler: () => {
          Clipboard
            .copy(message.message)
            .then(() => {
              Toast.showShortBottom('Message copied to clipboard');
            }, () => {
              Toast.showShortBottom('Message not copied - unable to access clipboard');
            });
        }
      });
    } else if (message.type === 'location') {
      actionSheetOpts.buttons.push({
        text: 'Copy Coordinates',
        icon: (vm.platform.is('ios')) ? undefined : 'copy',
        handler: () => {
          Clipboard
            .copy(message.latitude.toString() + ',' + message.longitude.toString())
            .then(() => {
              Toast.showShortBottom('Coordinates copied to clipboard');
            }, () => {
              Toast.showShortBottom('Coordinates not copied - unable to access clipboard');
            });
        }
      });
    }
    // Delete button
    if (message.user.is_me) {
      actionSheetOpts.buttons.push({
        text: 'Delete',
        role: 'destructive',
        icon: (vm.platform.is('ios')) ? undefined : 'trash',
        handler: () => {
          if (typeof(message.key) === 'undefined' || message.key === null) {
            vm.alertController.create({title: 'Unable to delete', subTitle: 'The message cannot be deleted right now as it is still being sent. Try again later.', buttons: ['Dismiss']}).present();
          } else {
            vm.friendConversationProvider.deleteMessage(vm.conversationId, message.key);
            var scopeMessages = vm.data.messages;
            for (var i = scopeMessages.length - 1; i >= 0; i--) {
              var scopeMessage = scopeMessages[i];
              if (scopeMessage.key === message.key) {
                vm.data.messages.splice(i, 1);
                break;
              }
            }
          }
        }
      });
    }
    // Cancel button
    actionSheetOpts.buttons.push({
      text: 'Cancel',
      role: 'cancel',
      icon: (vm.platform.is('ios')) ? undefined : 'close'
    });
    let actionSheet = vm.actionSheetController.create(actionSheetOpts);
    actionSheet.present();
  };

  // endregion

  // region Receiving Messages

  listenForNewMessages = () => {
    var vm = this;
    vm.friendConversationProvider.getChildAddedListenerRef(vm.conversationId, vm.data.messages).on('child_added', function (snapshot) {
      var message = snapshot.val();
      if (vm.sentMessageKeys.indexOf(snapshot.key) === -1) {
        setTimeout(() => {
          vm.data.messages.push({
            'key': snapshot.key,
            'timestamp': message.timestamp,
            'type': typeof(message.longitude) === 'undefined' ? 'message' : 'location',
            'message': message.message,
            'longitude': message.longitude,
            'latitude': message.latitude,
            'geo_uri': vm.helper.getGeoUriFromCoordinates(message.latitude, message.longitude),
            'geo_src': vm.helper.getSrcfromCoordinates(message.latitude, message.longitude),
            'user': {
              'user_id': message.user_id,
              'is_me': message.user_id === vm.userId
            }
          });
          vm.content.scrollToBottom(300);
        });
      }
    });

    vm.friendConversationProvider.getChildAddedListenerRef(vm.conversationId, vm.data.messages).on('child_removed', (oldSnapshot) => {
      var key = oldSnapshot.key;

      var messages = vm.data.messages;
      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        if (message.key === key) {
          vm.data.messages.splice(i, 1);
          break;
        }
      }
    });
  };

  // endregion

  // region Sending Messages

  sendMessage = () => {
    var vm = this;

    var message = vm.data.message;
    if (message.length < 1 || message.length > 1000) {
      Toast.showShortBottom('Your message must be between 1 and 1000 characters long.');
      return;
    }

    vm.data.message = '';
    var identifier = UUID.UUID();

    vm.addLocalMessageToScope({
      'uuid': identifier,
      'type': 'message',
      'message': message
    });

    var data = {
      'uuid': identifier,
      'user_id': vm.userData.getId(),
      'timestamp': firebase.database.ServerValue.TIMESTAMP,
      'message': message
    };
    vm.sendConversationMessageWithData(data);
  };

  showSendLocationPopup = () => {
    var vm = this;

    var onConfirm = () => {
      vm.nativeProvider.getPrecisePosition().then(function (position) {
        // Set coordinates
        vm.userData.setCoordinates([position.coords.latitude, position.coords.longitude]);

        var identifier = UUID.UUID();
        vm.addLocalMessageToScope({'uuid': identifier, 'type': 'location'});

        var data = {
          'uuid': identifier,
          'user_id': vm.userData.getId(),
          'timestamp': firebase.database.ServerValue.TIMESTAMP,
          'latitude': vm.userData.getLatitude(),
          'longitude': vm.userData.getLongitude()
        };
        vm.sendConversationMessageWithData(data);

      }, function (error) {
        Toast.showShortBottom('Error: Unable to retrieve your location. Your message was not sent. Ensure location retrieval is enabled and try again.');
      });
    };

    vm.alertController.create({
      title: 'Show Location',
      subTitle: 'Are you sure you want to share your location? Your precise location will be sent to all chat participants.',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: onConfirm
        }
      ]
    }).present();
  };

  // endregion

}
