import {Component, ViewChild} from '@angular/core';
import {NavController, Content, Alert, ActionSheet, Platform, NavParams, Loading} from 'ionic-angular';
import {UserData} from '../../providers/user-data/user-data.provider';
import {Helper} from '../../providers/helper/helper.provider';
import {UUID} from 'angular2-uuid/index';
import {Toast, Geolocation, Clipboard} from 'ionic-native/dist/index';
import {AppSettings} from '../../app-settings';
import {TimestampPipe} from '../../pipes/timestamp.pipe';
import {TimestampDirective} from '../../directives/timestamp.directive';
import {FriendsPage} from '../friends/friends';
import {FriendConversationProvider} from '../../providers/firebase/friend-conversation.provider';
import {FriendsProvider} from '../../providers/firebase/friends.provider';

@Component({
  templateUrl: 'build/pages/friend-conversation/friend-conversation.html',
  pipes: [TimestampPipe],
  directives: [TimestampDirective],
  providers: [FriendConversationProvider, FriendsProvider]
})
export class FriendConversationPage {

  constructor(private nav: NavController,
              private params: NavParams,
              private userData: UserData,
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
    var newMessageRef = vm.friendConversationProvider.getNewMessageRefByConversationId(vm.conversationId);
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
    vm.friendConversationProvider.addMessageToConversation(vm.conversationId, newMessageRef.key, data);
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

    vm.friendConversationProvider.getMessagesForFriendConversation(vm.friendId, vm.conversationId).then((messages) => {
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
          vm.nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve messages. Check your internet connection and restart the app.', buttons: ['Dismiss']}));
        }
      });
    });
  }

  showActionSheet = () => {
    var vm = this;

    function showRemoveDialog() {
      vm.nav.present(Alert.create({
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
              var loading = Loading.create({dismissOnPageChange: true});
              vm.nav.present(loading);
              vm.friendsProvider.removeFriendFromFriendsList(vm.friendId).then(() => {
                loading.dismiss();
                vm.userData.setIsFriendListStale(true);
                Toast.showShortBottom('The trainer has been removed from your friends list.');
                vm.nav.setRoot(FriendsPage);
              }).catch(error => {
                loading.dismiss();
                Toast.showLongBottom('Unable to remove friend - Check your internet connection and try again later.');
              });
            }
          }
        ]
      }));
    }

    let actionSheet = ActionSheet.create({
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
    this.nav.present(actionSheet);
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
        text: 'Copy coordinates',
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
            vm.nav.present(Alert.create({title: 'Unable to delete', subTitle: 'The message cannot be deleted right now as it is still being sent. Try again later.', buttons: ['Dismiss']}));
          } else {
            vm.friendConversationProvider.removeMessageFromConversation(vm.conversationId, message.key);
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
    let actionSheet = ActionSheet.create(actionSheetOpts);
    vm.nav.present(actionSheet);
  };

  // endregion

  // region Receiving Messages

  listenForNewMessages = () => {
    var vm = this;
    vm.friendConversationProvider.getChildAddedListenerReference(vm.conversationId, vm.data.messages).on('child_added', function (snapshot) {
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

    vm.friendConversationProvider.getChildAddedListenerReference(vm.conversationId, vm.data.messages).on('child_removed', (oldSnapshot) => {
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
      Geolocation
        .getCurrentPosition({timeout: 10000, enableHighAccuracy: true})
        .then(function (position) {
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

    vm.nav.present(Alert.create({
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
    }));
  };

  // endregion

}
