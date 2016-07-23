import {Component, ViewChild} from '@angular/core';
import {NavController, Content, Alert, ActionSheet, Platform, NavParams, ViewController, Loading} from 'ionic-angular';
import {UserData} from "../../providers/user-data/user-data.provider";
import {Helper} from "../../providers/helper/helper.provider";
import {UUID} from "angular2-uuid/index";
import {Toast, Geolocation, Clipboard} from "ionic-native/dist/index";
import {AppSettings} from "../../app-settings";
import {TimestampPipe} from "../../pipes/timestamp.pipe";
import {TimestampDirective} from "../../directives/timestamp.directive";
import {FriendsPage} from "../friends/friends";

/*
 Generated class for the FriendConversationPage page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  templateUrl: 'build/pages/friend-conversation/friend-conversation.html',
  pipes: [TimestampPipe],
  directives: [TimestampDirective]
})
export class FriendConversationPage {

  constructor(private nav:NavController,
              private params:NavParams,
              private view:ViewController,
              private userData:UserData,
              private helper:Helper,
              private platform:Platform) {
    this.friendId = this.params.get('friendId');
  };

  @ViewChild(Content) content:Content;

  private data = {
    'message': '',
    'messages': [],
    'friend': {
      'user_id': this.friendId,
      'added_at': null,
      'display_name': null,
      'team': null
    },
    'keyboardHeight': null
  };
  protected friendId;
  protected conversationId = this.helper.getConversationId(this.userData.getId(), this.friendId);
  private isIOS = this.platform.is('ios');
  protected sentMessageKeys = [];
  protected userId = this.userData.getId();
  protected isLoading = true;
  protected isInFriendsList = false;
  protected isConnectedToFriend = true;

  sendConversationMessageWithData = (data) => {
    var vm = this;
    // Create a message
    var newMessageRef = firebase.database().ref('friend_conversations/' + vm.conversationId + '/messages').push();
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
    var updatedMessageData = {};
    updatedMessageData[vm.conversationId + '/messages/' + newMessageRef.key] = data;
    updatedMessageData[vm.conversationId + '/last_messaged'] = firebase.database.ServerValue.TIMESTAMP;
    firebase.database().ref('friend_conversations').update(updatedMessageData);
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
      'is_me': true
    });
    vm.content.scrollToBottom(300);
  };

  /*
   * Scope Functions
   */

  ionViewDidEnter() {
    setTimeout(() => {
      this.content.scrollToBottom(300);
    });
  }

  inputUp = () => {
    var vm = this;
    if (vm.isIOS) vm.data.keyboardHeight = 216;
    setTimeout(() => {
      vm.content.scrollToBottom(300);
    }, 300);
  };

  inputDown = () => {
    if (this.isIOS) this.data.keyboardHeight = 0;
  };

  sendMessage = () => {
    var vm = this;

    var message = vm.data.message;
    if (message.length < 1 || message.length > 1000) {
      Toast.showShortBottom("Your message must be between 1 and 1000 characters long.");
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

  onMessageClicked = (message) => {
    var vm = this;
    if (message.is_me) {
      var buttons = [
        {
          text: 'Copy',
          icon: (vm.platform.is('ios')) ? undefined : 'copy',
          handler: () => {
            Clipboard
              .copy(message.message)
              .then(() => {
                Toast.showShortBottom("Message copied to clipboard");
              }, () => {
                Toast.showShortBottom("Message not copied - unable to access clipboard");
              });
          }
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: (vm.platform.is('ios')) ? undefined : 'trash',
          handler: () => {
            if (typeof(message.key) === 'undefined' || message.key === null) {
              vm.nav.present(Alert.create({title: "Unable to delete", subTitle: "The message cannot be deleted right now as it is still being sent. Try again later.", buttons: ['Dismiss']}));
            } else {
              firebase.database().ref('friend_conversations/' + vm.conversationId + '/messages/' + message.key).remove();
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
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: (vm.platform.is('ios')) ? undefined : 'close'
        }
      ];
      if (message.type !== 'message') {
        buttons.splice(0, 1);
      }
      var actionSheet = ActionSheet.create({
        title: 'Message Actions',
        buttons: buttons
      });
      vm.nav.present(actionSheet);
    }
  };

  /*
   * Runtime
   */

  listenForNewMessages = () => {
    var vm = this;
    var promise;
    if (vm.data.messages.length > 0) {
      promise = firebase.database().ref('friend_conversations/' + vm.conversationId + '/messages').orderByKey().startAt(vm.data.messages[vm.data.messages.length - 1].key);
    } else {
      promise = firebase.database().ref('friend_conversations/' + vm.conversationId + '/messages').orderByKey();
    }

    promise.on("child_added", function (snapshot) {
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
            'user_id': message.user_id,
            'is_me': message.user_id === vm.userId
          });
          vm.content.scrollToBottom(300);
        });
      }
    });

    promise.on("child_removed", (oldSnapshot) => {
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
              firebase.database().ref('members/' + vm.userData.getId() + '/friends/' + vm.friendId).remove(function (error) {
                loading.dismiss();
                if (error) {
                  Toast.showLongBottom('Unable to remove friend - Check your internet connection and try again later.');
                } else {
                  vm.userData.setIsFriendListStale(true);
                  Toast.showShortBottom('The trainer has been removed from your friends list.');
                  vm.nav.setRoot(FriendsPage);
                }
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

  ionViewLoaded() {
    var vm = this;
    // Check whether the friend is in the friends list
    var friends = vm.userData.getFriends();
    for (var i = 0; i < friends.length; i++) {
      var friend = friends[i];
      if (vm.friendId == friend.user_id) {
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

    // Check whether the friend is connected to the user
    firebase.database().ref('members/' + vm.friendId + '/friends/' + vm.userData.getId()).once('value').then((snapshot) => {
      if (!(snapshot.exists() && snapshot.hasChild('added_at'))) {
        return Promise.reject(AppSettings.ERROR['FRIEND_NOT_ADDED']);
      }
      vm.data.friend.added_at = snapshot.child('added_at').val();

      return firebase.database().ref('friend_conversations/' + vm.conversationId + '/messages').once('value');
    }).then((snapshot) => {
      // Populate the list of messages
      var messages = snapshot.val();
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
          'user_id': message.user_id,
          'is_me': message.user_id === vm.userId
        });
      }
      setTimeout(() => {
        vm.isLoading = false;
        vm.content.scrollToBottom(300);
      });
      vm.listenForNewMessages();

    }, function (error) {
      return Promise.reject(error);
    }).catch(function (error) {
      setTimeout(() => {
        if (error === AppSettings.ERROR['FRIEND_NOT_ADDED']) {
          setTimeout(() => {
            vm.isConnectedToFriend = false;
            vm.isLoading = false;
          });
        } else {
          vm.nav.present(Alert.create({title: "Error", subTitle: "Unable to retrieve messages. Check your internet connection and restart the app.", buttons: ['Dismiss']}));
        }
      })
    });
  }

}
