import {Component, ViewChild} from "@angular/core";
import {NavController, Platform, Content, Loading, Alert, ActionSheet} from "ionic-angular";
import {UserData} from "../../providers/user-data/user-data.provider";
import {Geolocation, Toast} from "ionic-native";
import {DistancePipe} from "../../pipes/distance.pipe";
import {TimestampPipe} from "../../pipes/timestamp.pipe";
import {TimestampDirective} from "../../directives/timestamp.directive";
import {UUID} from "angular2-uuid";

@Component({
  templateUrl: 'build/pages/public-conversation/public-conversation.html',
  directives: [TimestampDirective],
  pipes: [TimestampPipe, DistancePipe]
})
export class PublicConversationPage {

  constructor(private nav:NavController, private platform:Platform, private userData:UserData) {
    this.platform = platform;
    this.userData = userData;
  }

  @ViewChild(Content) content:Content;

  private isLoading = true;

  private data = {'message': '', keyboardHeight: null};
  private messages = [];
  private isMessagePresent = false;

  private geoQuery;
  private isGeoQueryInitialized = false;

  private currentRadius;
  private currentBlockList;

  private sentMessageKeys = [];
  private isIOS = this.platform.is('ios');
  private geoFire = new GeoFire(firebase.database().ref('public_message_locations'));

  private loading;

  /*
   * Helper Functions
   */

  startGeoQuery = () => {
    var vm = this;

    vm.currentBlockList = vm.userData.getBlockList();
    vm.currentRadius = vm.userData.getRadius();
    vm.geoQuery = vm.geoFire.query({
      center: [vm.userData.getLatitude(), vm.userData.getLongitude()],
      radius: vm.userData.getRadius()
    });

    vm.geoQuery.on("ready", () => {
      vm.isGeoQueryInitialized = true;
      vm.isLoading = false;
      setTimeout(() => {
        vm.content.scrollToBottom(300);
      });
    });

    vm.geoQuery.on("key_entered", function (key, location, distance) {
      if (vm.sentMessageKeys.indexOf(key) === -1) {
        vm.transferGeoQueryResultFromFirebaseToScope(key, location, distance);
      }
    });

    vm.geoQuery.on("key_exited", function (key, location, distance) {
      var messages = vm.messages;
      for (var i = messages.length - 1; i >= 0; i--) {
        var message = messages[i];
        if (message.key === key) {
          vm.messages.splice(i, 1);
        }
      }
    });
  };

  showLoading = () => {
    this.loading = Loading.create({dismissOnPageChange: true});
    this.nav.present(this.loading);
  };

  isUserIdInBlockList = (userId) => {
    var vm = this;
    var blockList = vm.userData.getBlockList();
    for (var i = 0; i < blockList.length; i++) {
      var blockListUser = blockList[i];
      if (blockListUser.user_id === userId) {
        return true;
      }
    }
    return false;
  };

  sortScopeMessagesByTimestamp = () => {
    var vm = this;
    setTimeout(() => {
      vm.messages.sort(function (x, y) {
        return x.timestamp - y.timestamp;
      });
      vm.content.scrollToBottom(300);
    });
  };

  transferGeoQueryResultFromFirebaseToScope = (key, location, distance) => {
    var vm = this;
    firebase.database().ref('/public_messages/' + key).once('value').then(function (snapshot) {
      if (snapshot.exists() && snapshot.hasChild('timestamp') && snapshot.hasChild('user') && snapshot.hasChild('uuid')) {
        var messageSnapshot = snapshot.val();
        vm.messages.push({
          'key': key,
          'uuid': messageSnapshot.uuid,
          'distance': distance,
          'timestamp': messageSnapshot.timestamp,
          'type': typeof(messageSnapshot.longitude) === 'undefined' ? 'message' : 'location',
          'message': messageSnapshot.message,
          'longitude': messageSnapshot.longitude,
          'latitude': messageSnapshot.latitude,
          'user': {
            'user_id': messageSnapshot.user.user_id,
            'display_name': messageSnapshot.user.display_name,
            'team': messageSnapshot.user.team,
            'is_me': messageSnapshot.user.user_id === vm.userData.getId()
          },
          'is_hidden': vm.isUserIdInBlockList(messageSnapshot.user.user_id)
        });

        if (vm.isMessagePresent === false && !vm.isUserIdInBlockList(messageSnapshot.user.user_id)) {
          vm.isMessagePresent = true;
        }

        vm.sortScopeMessagesByTimestamp();
      }
    }, function (error) {
      if (!(error.message.search('permission_denied') > -1)) {
        throw error;
      }
    });
  };

  sendConversationMessageWithData = (data) => {
    var vm = this;
    // Create a message
    var newMessageRef = firebase.database().ref('public_messages').push();
    vm.sentMessageKeys.push(newMessageRef.key);

    var messages = vm.messages;
    for (var i = messages.length - 1; i >= 0; i--) {
      var message = messages[i];
      if (message.uuid === data.uuid && message.key === '') {
        message.key = newMessageRef.key;
        vm.messages[i] = message;
        break;
      }
    }

    // Set the message
    newMessageRef.set(data, function (error) {
      if (!error) {
        // Set the GeoFire instance of the message
        vm.geoFire.set(newMessageRef.key, [vm.userData.getFuzzyLatitude(), vm.userData.getFuzzyLongitude()]).then();
      }
    });
  };

  addLocalMessageToScope = (data) => {
    var vm = this;
    vm.messages.push({
      'key': '',
      'uuid': data.uuid,
      'distance': 0,
      'timestamp': Date.now(),
      'type': data.type,
      'message': data.message,
      'latitude': vm.userData.getLatitude(),
      'longitude': vm.userData.getLongitude(),
      'user': {
        'user_id': vm.userData.getId(),
        'display_name': vm.userData.getDisplayName(),
        'team': vm.userData.getTeam(),
        'is_me': true
      }
    });
    vm.isMessagePresent = true;

    setTimeout(() => {
      vm.content.scrollToBottom(300);
    });
  };

  /*
   * Scope Functions
   */

  ionViewLoaded() {
    this.startGeoQuery();
  }

  ionViewWillEnter() {
    var vm = this;
    // Check whether the radius has been changed in settings
    if (typeof(vm.currentRadius) !== 'undefined' && (vm.isGeoQueryInitialized && vm.currentRadius !== vm.userData.getRadius())) {
      vm.isLoading = true;
      vm.geoQuery.cancel();
      vm.messages = [];
      vm.isMessagePresent = false;
      vm.startGeoQuery();
    } else if (vm.userData.getIsBlockListStale()) {
      // Check whether the block list has changed, and if so, un-hide unblocked users
      vm.userData.setIsBlockListStale(false);
      vm.currentBlockList = vm.userData.getBlockList();
      var blockListUserIds = [];
      vm.currentBlockList.forEach(function (blockedUser) {
        blockListUserIds.push(blockedUser.user_id);
      });
      var scopeMessages = vm.messages;
      for (var i = scopeMessages.length - 1; i >= 0; i--) {
        var scopeMessage = scopeMessages[i];
        if (scopeMessage.is_hidden === true && blockListUserIds.indexOf(scopeMessage.user.user_id) === -1) {
          scopeMessage.is_hidden = false;
          vm.messages[i] = scopeMessage;
        }
      }
    }
  };

  inputUp = () => {
    var vm = this;
    if (vm.isIOS) vm.data.keyboardHeight = 216;
    setTimeout(() => {
      vm.content.scrollToBottom(300);
    });

  };

  inputDown = () => {
    var vm = this;
    if (vm.isIOS) vm.data.keyboardHeight = 0;
  };

  sendMessage = () => {
    var vm = this;
    // TODO: Add front-end and back-end validation

    var message = vm.data.message;
    vm.data.message = '';
    var identifier = UUID.UUID();

    vm.addLocalMessageToScope({
      'uuid': identifier,
      'type': 'message',
      'message': message
    });

    var data = {
      'uuid': identifier,
      'user': {
        'user_id': vm.userData.getId(),
        'display_name': vm.userData.getDisplayName(),
        'team': vm.userData.getTeam()
      },
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
            'user': {
              'user_id': vm.userData.getId(),
              'display_name': vm.userData.getDisplayName(),
              'team': vm.userData.getTeam()
            },
            'timestamp': firebase.database.ServerValue.TIMESTAMP,
            'latitude': vm.userData.getLatitude(),
            'longitude': vm.userData.getLongitude()
          };
          vm.sendConversationMessageWithData(data);

        }, function (error) {
          vm.nav.present(Alert.create({title: 'Unable to retrieve location', subTitle: 'Your message was not sent. Ensure location services are enabled and try again.', buttons: ['Dismiss']}));
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

    var showBlockPopup = (message) => {

      var handleAlert = (data) => {
        vm.showLoading();
        firebase.database().ref('block_list/' + vm.userData.getId() + '/' + message.user.user_id).set({
          'display_name': message.user.display_name,
          'blocked_at': firebase.database.ServerValue.TIMESTAMP
        }, function (error) {
          if (error) {
            vm.loading.dismiss();
            Toast.showLongBottom("The user could not be blocked. Check your internet connection and try again.");
            return;
          }

          var blockList = vm.userData.getBlockList();
          blockList.push({'user_id': message.user.user_id, 'display_name': message.user.display_name, 'blocked_at': Date.now()});
          vm.userData.setBlockList(blockList);
          vm.currentBlockList = vm.userData.getBlockList();

          // Loop through all messages, hiding where the user ID is on the block list
          var scopeMessages = vm.messages;
          for (var i = scopeMessages.length - 1; i >= 0; i--) {
            var scopeMessage = scopeMessages[i];
            if (scopeMessage.user.user_id === message.user.user_id) {
              scopeMessage.is_hidden = true;
              vm.messages[i] = scopeMessage;
            }
          }
          vm.loading.dismiss();
          Toast.showLongBottom("The user has been blocked. You can unblock them in the Settings page.");
        });
      };

      vm.nav.present(Alert.create({
        title: 'Block user?',
        message: 'Are you sure you want to block the user? You will not be able to see their messages, but they will be able to see yours. You can unblock them on your settings page.',
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: data => {

            }
          },
          {
            text: 'Yes',
            handler: handleAlert
          }
        ]
      }));
    };

    if (message.user.is_me) {
      vm.nav.present(ActionSheet.create({
        title: 'Message Actions',
        buttons: [
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => {
              if (typeof(message.key) === 'undefined' || message.key === null) {
                vm.nav.present(Alert.create({title: 'Unable to delete', subTitle: 'The message cannot be deleted at this time as it is still being sent to the server.', buttons: ['Dismiss']}));
              } else {
                vm.geoFire.remove(message.key);
                var scopeMessages = vm.messages;
                for (var i = scopeMessages.length - 1; i >= 0; i--) {
                  var scopeMessage = scopeMessages[i];
                  if (scopeMessage.key === message.key) {
                    vm.messages.splice(i, 1);
                    break;
                  }
                }
              }
              return true;
            }
          },
          {
            text: 'Cancel',
            role: 'cancel',
          }
        ]
      }));
    } else {
      let actionSheet = ActionSheet.create({
        title: 'Message Actions',
        buttons: [
          {
            text: 'Block',
            role: 'destructive',
            handler: () => {
              actionSheet.dismiss().then(() => {
                showBlockPopup(message);
              });
            }
          },
          {
            text: 'Cancel',
            role: 'cancel',
          }
        ]
      });
      vm.nav.present(actionSheet);
    }
  };

}
