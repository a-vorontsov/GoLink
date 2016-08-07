import {Component, ViewChild} from "@angular/core";
import {Content, NavController, NavParams, Loading, Platform, AlertController, ActionSheetController, LoadingController} from "ionic-angular";
import {Toast, Clipboard} from "ionic-native";
import {TimestampDirective} from "../../directives/timestamp.directive";
import {ChatInputDirective} from "../../directives/chat-input.directive";
import {TimestampPipe} from "../../pipes/timestamp.pipe";
import {ChannelConversationProvider} from "../../providers/firebase/channel-conversation.provider";
import {UserData} from "../../providers/user-data/user-data.provider";
import {Helper} from "../../providers/helper/helper.provider";
import {NativeProvider} from "../../providers/native-provider/native-provider";
import {UUID} from "angular2-uuid/index";
import {ChannelsPage} from "../channels/channels";
import {ChannelsProvider} from "../../providers/firebase/channels.provider";

@Component({
  templateUrl: 'build/pages/channel-conversation/channel-conversation.html',
  pipes: [TimestampPipe],
  directives: [TimestampDirective, ChatInputDirective],
  providers: [ChannelConversationProvider, NativeProvider, ChannelsProvider]
})
export class ChannelConversationPage {

  constructor(private nav: NavController,
              private params: NavParams,
              private userData: UserData,
              private alertController: AlertController,
              private actionSheetController: ActionSheetController,
              private loadingController: LoadingController,
              private nativeProvider: NativeProvider,
              private channelsProvider: ChannelsProvider,
              private channelConversationProvider: ChannelConversationProvider,
              private helper: Helper,
              private platform: Platform) {
    this.channelId = this.params.get('channelId');
  };

  @ViewChild(Content) content: Content;

  isInChannel: boolean = true;
  isLoading: boolean = true;
  data: any = {'message': '', 'messages': []};

  protected sentMessageKeys: any[] = [];
  protected channelId;
  protected userId = this.userData.getId();

  sendConversationMessageWithData = (data: ChannelConversationMessage) => {
    var vm = this;
    // Create a message
    var newMessageRef = vm.channelConversationProvider.getNewMessageRef(vm.channelId);
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
    vm.channelConversationProvider.addMessage(vm.channelId, newMessageRef.key, data);
  };

  addLocalMessageToScope = (data) => {
    var vm = this;
    vm.data.messages.push({
      'uuid': data.uuid,
      'key': '',
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

  // region Helper Functions

  private loading: Loading;
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

  private getMessageType = (message) => {
    if (message.is_joined === true) {
      return 'joined';
    } else if (message.is_joined === false) {
      return 'left';
    } else if (typeof(message.longitude) === 'undefined') {
      return 'message';
    } else {
      return 'location';
    }
  };

  // endregion

  // region Ionic View Events

  ionViewDidEnter() {
    setTimeout(() => {
      this.content.scrollToBottom(300);
    });
  }

  ionViewLoaded() {
    var vm = this;

    // Check whether the channel is in the channels list
    let channels = vm.userData.getChannels();
    let isInChannelsList = false;
    for (var i = 0; i < channels.length; i++) {
      var channel = channels[i];
      if (vm.channelId === channel.channel_id) {
        isInChannelsList = true;
        break;
      }
    }
    if (!isInChannelsList) {
      vm.isInChannel = false;
      return;
    }

    vm.data.messages = [];
    vm.channelConversationProvider.getMessages(vm.channelId).then((messages) => {
      // Populate the list of messages
      for (var key in messages) {
        var message = messages[key];
        vm.data.messages.push({
          'key': key,
          'timestamp': message.timestamp,
          'type': vm.getMessageType(message),
          'message': message.message,
          'longitude': message.longitude,
          'latitude': message.latitude,
          'geo_uri': vm.helper.getGeoUriFromCoordinates(message.latitude, message.longitude),
          'geo_src': vm.helper.getSrcfromCoordinates(message.latitude, message.longitude),
          'user': {
            'user_id': message.user.user_id,
            'display_name': message.user.display_name,
            'team': message.user.team,
            'is_me': message.user.user_id === vm.userId
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
        vm.alertController.create({title: 'Error', subTitle: 'Unable to retrieve messages. Check your internet connection and restart the app.', buttons: ['Dismiss']}).present();
      });
    });
  }

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
            vm.channelConversationProvider.deleteMessage(vm.channelId, message.key);
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

  showActionSheet = () => {
    var vm = this;

    function showRemoveDialog() {
      vm.alertController.create({
        title: 'Leave channel?',
        message: 'Are you sure you want to leave this channel?',
        buttons: [
          {
            text: 'No',
            role: 'cancel'
          },
          {
            text: 'Yes',
            handler: () => {
              vm.showIonicLoading();
              vm.channelsProvider.leaveChannel(vm.channelId).then(() => {
                vm.hideIonicLoading();
                vm.userData.setIsChannelsStale(true);
                Toast.showShortBottom('You have left the channel.');
                vm.nav.setRoot(ChannelsPage);
              }).catch(error => {
                vm.hideIonicLoading();
                Toast.showLongBottom('Unable to leave channel - Check your internet connection and try again later.');
              });
            }
          }
        ]
      }).present();
    }

    let actionSheet = vm.actionSheetController.create({
      buttons: [
        {
          text: 'Leave Channel',
          role: 'destructive',
          icon: (vm.platform.is('ios')) ? undefined : 'exit',
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

  // endregion

  // region Receiving Messages

  listenForNewMessages = () => {
    var vm = this;
    vm.channelConversationProvider.getChildAddedListenerRef(vm.channelId, vm.data.messages).on('child_added', function (snapshot) {
      var message = snapshot.val();
      if (vm.sentMessageKeys.indexOf(snapshot.key) === -1 && vm.data.messages[vm.data.messages.length - 1]['key'] !== snapshot.key) {
        setTimeout(() => {
          vm.data.messages.push({
            'key': snapshot.key,
            'timestamp': message.timestamp,
            'type': vm.getMessageType(message),
            'message': message.message,
            'longitude': message.longitude,
            'latitude': message.latitude,
            'geo_uri': vm.helper.getGeoUriFromCoordinates(message.latitude, message.longitude),
            'geo_src': vm.helper.getSrcfromCoordinates(message.latitude, message.longitude),
            'user': {
              'user_id': message.user.user_id,
              'is_me': message.user.user_id === vm.userId
            }
          });
          vm.content.scrollToBottom(300);
        });
      }
    });

    vm.channelConversationProvider.getChildAddedListenerRef(vm.channelId, vm.data.messages).on('child_removed', (oldSnapshot) => {
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
      'user': {
        'user_id': vm.userId,
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
      vm.nativeProvider.getPrecisePosition().then(function (position) {
        // Set coordinates
        vm.userData.setCoordinates([position.coords.latitude, position.coords.longitude]);

        var identifier = UUID.UUID();
        vm.addLocalMessageToScope({'uuid': identifier, 'type': 'location'});

        var data = {
          'uuid': identifier,
          'user': {
            'user_id': vm.userId,
            'display_name': vm.userData.getDisplayName(),
            'team': vm.userData.getTeam()
          },
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
