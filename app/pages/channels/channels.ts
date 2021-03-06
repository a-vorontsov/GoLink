import {Component} from "@angular/core";
import {NavController, AlertController, LoadingController, ToastController} from "ionic-angular";
import {ChannelsProvider} from "../../providers/firebase/channels.provider";
import {UserData} from "../../providers/user-data/user-data.provider";
import {Toast} from "ionic-native";
import {TimestampDirective} from "../../directives/timestamp.directive";
import {ChannelConversationPage} from "../channel-conversation/channel-conversation";

@Component({
  templateUrl: 'build/pages/channels/channels.html',
  providers: [ChannelsProvider],
  directives: [TimestampDirective]
})
export class ChannelsPage {

  isLoading = true;
  data = {
    'channels': []
  };

  constructor(private nav: NavController,
              private userData: UserData,
              private toastController: ToastController,
              private loadingController: LoadingController,
              private alertController: AlertController,
              private channelsProvider: ChannelsProvider) {
  }

  /*
   * General helper functions
   */
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

  private sortChannelsList = (channels) => {
    channels.sort(function (x, y) {
      return y.last_messaged - x.last_messaged;
    });
  }
    ;
  navigateConversation = (channelId) => {
    this.nav.push(ChannelConversationPage, {
      channelId: channelId
    });
  };

  /*
   * Creating channels
   */
  showAddChannelPopup = () => {
    var vm = this;

    let enterChannelCodePopup = vm.alertController.create({
      title: 'Join/Create Channel',
      message: 'Enter a channel name up to 16 characters (can contain alphanumeric characters, hyphens and underscores).',
      inputs: [{name: 'targetChannelId', placeholder: ''}],
      buttons: [
        {text: 'Cancel', role: 'cancel'},
        {
          text: 'Save',
          handler: data => {
            let targetChannelId = data['targetChannelId'];
            if (!targetChannelId
              || targetChannelId.length < 1
              || targetChannelId.length > 16) {
              vm.toastController.create({message: 'Enter a channel name up to 16 characters', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
            } else if (!targetChannelId.match(/^[a-zA-Z0-9-_]+$/)) {
              Toast.showShortBottom('Your channel name may only contain alphanumeric characters, hyphens and underscores.')
            } else {
              // Code passes validation check
              enterChannelCodePopup.dismiss().then(() => {
                vm.showIonicLoading();
                return vm.channelsProvider.joinChannel(targetChannelId);
              }).then(() => {
                vm.hideIonicLoading();
                vm.data.channels.push({'channel_id': targetChannelId, 'joined_at': Date.now()});
                vm.navigateConversation(targetChannelId);
              }).catch(() => {
                vm.hideIonicLoading();
                vm.toastController.create({message: 'An error occurred. Check your internet connection and try again.', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
              });
            }
            return false;
          }
        }
      ]
    });
    enterChannelCodePopup.present();
  };

  /*
   * Getting list of channels
   */
  updateChannels() {
    var vm = this;
    var tempChannels = [];
    var channelIds = [];
    vm.channelsProvider.getChannels().then(channels => {
      for (let channelId in channels) {
        let channel = channels[channelId];
        tempChannels.push({'channel_id': channelId, 'joined_at': channel.joined_at});
        channelIds.push(channelId);
      }

      for (let channelId of channelIds) {
        // Listen for timestamp updates
        vm.channelsProvider.getLastMessageRefByChannelId(channelId).on('value', snapshot => {
          var lastMessaged = snapshot.val();
          for (var i = 0; i < tempChannels.length; i++) {
            if (tempChannels[i].channel_id === channelId) {
              setTimeout(function () {
                if (typeof(lastMessaged) === undefined || lastMessaged === null) {
                  tempChannels[i].last_messaged = 0;
                } else {
                  tempChannels[i].last_messaged = (lastMessaged >= Date.now()) ? Date.now() - 1 : lastMessaged;
                }
                vm.sortChannelsList(tempChannels);
              });
              break;
            }
          }
        });
      }

      vm.data.channels = tempChannels;
      vm.userData.setChannels(vm.data.channels);
      vm.userData.setIsChannelsStale(false);
      vm.isLoading = false;
    }).catch(error => {
      vm.alertController.create({title: 'Error', subTitle: 'Unable to retrieve channels. Check your internet connection and restart the app.', buttons: ['Dismiss']}).present();
    });
  }

  ionViewDidEnter() {
    if (this.data.channels.length === 0 || this.userData.getIsChannelsStale()) {
      this.updateChannels();
    }
  };

}
