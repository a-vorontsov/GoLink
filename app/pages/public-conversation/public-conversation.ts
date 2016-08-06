import {Component, ViewChild} from '@angular/core';
import {NavController, Platform, Content, Loading, Alert, ActionSheet} from 'ionic-angular';
import {UserData} from '../../providers/user-data/user-data.provider';
import {Toast, Clipboard} from 'ionic-native';
import {DistancePipe} from '../../pipes/distance.pipe';
import {TimestampPipe} from '../../pipes/timestamp.pipe';
import {TimestampDirective} from '../../directives/timestamp.directive';
import {UUID} from 'angular2-uuid';
import {Helper} from '../../providers/helper/helper.provider';
import {PublicConversationProvider} from '../../providers/firebase/public-conversation.provider';
import {MemberProvider} from '../../providers/firebase/member.provider';
import {NativeProvider} from '../../providers/native-provider/native-provider';
import {ReportProvider} from '../../providers/firebase/report.provider';

@Component({
  templateUrl: 'build/pages/public-conversation/public-conversation.html',
  directives: [TimestampDirective],
  pipes: [TimestampPipe, DistancePipe],
  providers: [PublicConversationProvider, MemberProvider, NativeProvider, ReportProvider]
})
export class PublicConversationPage {

  constructor(private nav: NavController,
              private platform: Platform,
              private userData: UserData,
              private helper: Helper,
              private publicConversationProvider: PublicConversationProvider,
              private nativeProvider: NativeProvider,
              private memberProvider: MemberProvider,
              private reportProvider: ReportProvider) {
  }

  @ViewChild(Content) content: Content;

  isLoading: boolean = true;
  isMessagePresent: boolean = false;
  data: any = {'message': '', 'messages': []};

  protected geoFire = new GeoFire(this.publicConversationProvider.getPublicMessageLocationRef());
  protected geoQuery;
  protected isGeoQueryInitialized: boolean;

  protected currentRadius: number;
  protected currentBlockList: any;
  protected sentMessageKeys: any[] = [];

  // region Helper Functions

  private loading: Loading;
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

  private sortScopeMessagesByTimestamp = () => {
    var vm = this;
    setTimeout(() => {
      vm.data.messages.sort(function (x, y) {
        return x.timestamp - y.timestamp;
      });
      vm.content.scrollToBottom(300);
    });
  };

  // endregion

  // region Ionic View Events

  ionViewLoaded() {
    this.startGeoQuery();
  }

  ionViewDidEnter() {
    var vm = this;
    // Check whether the radius has been changed in settings
    if (typeof(vm.currentRadius) !== 'undefined' && (vm.isGeoQueryInitialized && vm.currentRadius !== vm.userData.getRadius())) {
      vm.isLoading = true;
      vm.geoQuery.cancel();
      vm.data.messages = [];
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
      var scopeMessages = vm.data.messages;
      for (var i = scopeMessages.length - 1; i >= 0; i--) {
        var scopeMessage = scopeMessages[i];
        if (scopeMessage.is_hidden === true && blockListUserIds.indexOf(scopeMessage.user.user_id) === -1) {
          scopeMessage.is_hidden = false;
          vm.data.messages[i] = scopeMessage;
          vm.isMessagePresent = true;
        }
      }
    }
  };

  onMessageClicked = (message) => {
    var vm = this;

    var showBlockPopup = (message) => {

      let handleAlert = (data) => {
        vm.showIonicLoading();
        vm.memberProvider.addUserToBlockList(message.user.user_id, message.user.display_name).then(() => {
          vm.currentBlockList = vm.userData.getBlockList();

          // Loop through all messages, hiding where the user ID is on the block list
          var scopeMessages = vm.data.messages;
          for (var i = scopeMessages.length - 1; i >= 0; i--) {
            var scopeMessage = scopeMessages[i];
            if (scopeMessage.user.user_id === message.user.user_id) {
              scopeMessage.is_hidden = true;
              vm.data.messages[i] = scopeMessage;
            }
          }
          vm.hideIonicLoading();
          Toast.showLongBottom('The user has been blocked. You can unblock them in the Settings page.');
        }).catch(error => {
          vm.hideIonicLoading();
          Toast.showLongBottom('The user could not be blocked. Check your internet connection and try again.');
          return;
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
              return true;
            }
          },
          {
            text: 'Yes',
            handler: handleAlert
          }
        ]
      }));
    };

    var showReportPopup = (message) => {
      vm.nav.present(Alert.create({
        title: 'Report',
        message: 'Write a reason below. Misuse of this feature will result in your account being disabled.',
        inputs: [{
          name: 'reason',
          placeholder: 'Reason'
        }],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Submit',
            handler: data => {
              if (data.reason.length < 1 || data.reason.length > 300) {
                Toast.showShortBottom('Your reason must be between 1 and 300 characters long.');
                return false;
              }

              vm.reportProvider.addReport('public_message', message['key'], data.reason).then(() => {
                Toast.showShortBottom('Your report has successfully been submitted.');
                return true;
              }).catch(error => {
                Toast.showShortBottom('Your report could not be submitted. Check your internet connection and try again.');
                return false;
              });
            }
          }
        ]
      }));
    };

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
            vm.nav.present(Alert.create({title: 'Unable to delete', subTitle: 'The message cannot be deleted at this time as it is still being sent to the server.', buttons: ['Dismiss']}));
          } else {
            vm.geoFire.remove(message.key);
            var scopeMessages = vm.data.messages;
            for (var i = scopeMessages.length - 1; i >= 0; i--) {
              var scopeMessage = scopeMessages[i];
              if (scopeMessage.key === message.key) {
                vm.data.messages.splice(i, 1);
                break;
              }
            }
          }
          return true;
        }
      });
    } else {
      actionSheetOpts.buttons.push({
          text: 'Report',
          role: 'destructive',
          icon: (vm.platform.is('ios')) ? undefined : 'alert',
          handler: () => {
            actionSheet.dismiss().then(() => {
              showReportPopup(message);
            });
          }
        },
        {
          text: 'Block',
          role: 'destructive',
          icon: (vm.platform.is('ios')) ? undefined : 'remove-circle',
          handler: () => {
            actionSheet.dismiss().then(() => {
              showBlockPopup(message);
            });
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

  startGeoQuery = () => {
    var vm = this;

    vm.currentBlockList = vm.userData.getBlockList();
    vm.currentRadius = vm.userData.getRadius();
    vm.geoQuery = vm.geoFire.query({
      center: [vm.userData.getLatitude(), vm.userData.getLongitude()],
      radius: vm.userData.getRadius()
    });

    vm.geoQuery.on('ready', () => {
      vm.isGeoQueryInitialized = true;
      vm.isLoading = false;
      setTimeout(() => {
        vm.content.scrollToBottom(300);
      });
    });

    vm.geoQuery.on('key_entered', function (key, location, distance) {
      if (vm.sentMessageKeys.indexOf(key) === -1) {
        vm.transferGeoQueryResultFromFirebaseToScope(key, location, distance);
      }
    });

    vm.geoQuery.on('key_exited', function (key, location, distance) {
      var messages = vm.data.messages;
      for (var i = messages.length - 1; i >= 0; i--) {
        var message = messages[i];
        if (message.key === key) {
          vm.data.messages.splice(i, 1);
        }
      }
    });
  };

  transferGeoQueryResultFromFirebaseToScope = (key, location, distance) => {
    var vm = this;
    vm.publicConversationProvider.getSnapshotForMessageKey(key).then(function (snapshot) {
      if (snapshot.exists() && snapshot.hasChild('timestamp') && snapshot.hasChild('user') && snapshot.hasChild('uuid')) {
        var messageSnapshot = snapshot.val();
        vm.data.messages.push({
          'key': key,
          'uuid': messageSnapshot.uuid,
          'distance': distance,
          'timestamp': messageSnapshot.timestamp,
          'type': typeof(messageSnapshot.longitude) === 'undefined' ? 'message' : 'location',
          'message': messageSnapshot.message,
          'latitude': messageSnapshot.latitude,
          'longitude': messageSnapshot.longitude,
          'geo_uri': vm.helper.getGeoUriFromCoordinates(messageSnapshot.latitude, messageSnapshot.longitude),
          'geo_src': vm.helper.getSrcfromCoordinates(messageSnapshot.latitude, messageSnapshot.longitude),
          'user': {
            'user_id': messageSnapshot.user.user_id,
            'display_name': messageSnapshot.user.display_name,
            'team': messageSnapshot.user.team,
            'is_me': messageSnapshot.user.user_id === vm.userData.getId()
          },
          'is_hidden': vm.memberProvider.isUserIdInCachedBlockList(messageSnapshot.user.user_id)
        });

        if (vm.isMessagePresent === false && !vm.memberProvider.isUserIdInCachedBlockList(messageSnapshot.user.user_id)) {
          vm.isMessagePresent = true;
        }

        vm.sortScopeMessagesByTimestamp();
      }
    }).catch(error => {
      if (!(error['message'].search('permission_denied') > -1)) {
        throw error;
      }
    });
  };

  // endregion

  // region Sending Messages

  addLocalMessageToScope = (data) => {
    var vm = this;
    vm.data.messages.push({
      'key': '',
      'uuid': data.uuid,
      'distance': 0,
      'timestamp': Date.now(),
      'type': data.type,
      'message': data.message,
      'latitude': vm.userData.getLatitude(),
      'longitude': vm.userData.getLongitude(),
      'geo_uri': vm.helper.getGeoUriFromCoordinates(vm.userData.getLatitude(), vm.userData.getLongitude()),
      'geo_src': vm.helper.getSrcfromCoordinates(vm.userData.getLatitude(), vm.userData.getLongitude()),
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

  sendConversationMessageWithData = (data: PublicConversationMessage) => {
    var vm = this;
    // Create a message
    var newMessageRef = vm.publicConversationProvider.getNewMessageRef();
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
    vm.publicConversationProvider.setMessageForRef(newMessageRef, data).then((ref) => {
      // Set the GeoFire instance of the message
      vm.geoFire.set(newMessageRef.key, [vm.userData.getFuzzyLatitude(), vm.userData.getFuzzyLongitude()]);
    }).catch(error => {
    });
  };

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
      vm.nativeProvider.getPrecisePosition().then(position => {
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

  // endregion


}
