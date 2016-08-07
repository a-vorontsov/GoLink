import {Component} from "@angular/core";
import {NavController, ModalController, AlertController, LoadingController} from "ionic-angular";
import {UserData} from "../../providers/user-data/user-data.provider";
import {SplashPage} from "../splash/splash";
import {Toast} from "ionic-native";
import {RadiusModal} from "./modals/radius/radius.modal";
import {BlockListModal} from "./modals/block-list/block-list.modal";
import {MemberProvider} from "../../providers/firebase/member.provider";
import {AuthProvider} from "../../providers/firebase/auth.provider";

@Component({
  templateUrl: 'build/pages/settings/settings.html',
  providers: [AuthProvider, MemberProvider]
})
export class SettingsPage {

  data: any;

  constructor(private nav: NavController,
              private alertController: AlertController,
              private modalController: ModalController,
              private loadingController: LoadingController,
              private userData: UserData,
              private authProvider: AuthProvider,
              private memberProvider: MemberProvider) {
    this.data = {
      'displayName': this.userData.getDisplayName(),
      'team': this.userData.getTeam(),
      'radius': this.userData.getRadius(),
      'blockedUsers': this.userData.getBlockList()
    };
  }

  ionWillEnter() {
    var vm = this;
    if (vm.userData.getIsBlockListStale() === true) {
      this.data.blockedUsers = this.userData.getBlockList();
    }
  }

  protected radius;

  private loading;
  showIonicLoading = () => {
    var vm = this;
    vm.loading = vm.loadingController.create({dismissOnPageChange: true});
    vm.loading.present();
  };

  hideIonicLoading = () => {
    if (this.loading) {
      setTimeout(() => {
        this.loading.dismiss();
      }, 300);
    }
  };

  signOut = () => {
    var vm = this;
    vm.authProvider.signOut().then(function () {
      vm.nav.setRoot(SplashPage);
    }).catch(function (error) {
      vm.alertController.create({title: 'Error', subTitle: 'Unable to sign out. Try again later or clear app data/reinstall the app.', buttons: ['Dismiss']}).present();
    });
  };

  showUpdateDisplayNamePopup = () => {
    var vm = this;

    var updateDisplayName = (displayName) => {
      vm.showIonicLoading();

      vm.memberProvider.updateDisplayName(displayName).then(() => {
        vm.hideIonicLoading();
        vm.data.displayName = displayName;
        Toast.showShortBottom(('Your display name has successfully been updated.'));
      }).catch(error => {
        vm.hideIonicLoading();
        Toast.showShortBottom('Error - Save failed. Check your internet connection and try again later.');
      });
    };

    vm.alertController.create({
      title: 'Update display name',
      inputs: [
        {
          name: 'displayName',
          placeholder: ''
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
          }
        },
        {
          text: 'Update',
          handler: data => {
            var displayName = data.displayName;
            if (displayName.length < 1) {
              Toast.showLongBottom('Enter a display name.');
              return false;
            } else if (displayName.length > 16) {
              Toast.showLongBottom('Your display name cannot be greater than 16 characters.');
              return false;
            } else if (displayName === vm.data.displayName) {
              Toast.showLongBottom('Your new display name cannot be the same as your current one.');
              return false;
            } else {
              updateDisplayName(displayName);
              return true;
            }
          }
        }
      ]
    }).present();
  };

  showUpdateTeamPopup = () => {
    var vm = this;

    var updateTeam = (team) => {
      vm.showIonicLoading();
      vm.memberProvider.updateTeam(team).then(() => {
        vm.data.team = team;
        Toast.showShortBottom('Your team name has successfully been updated.');
        vm.hideIonicLoading();
      }).catch(error => {
        vm.hideIonicLoading();
        Toast.showShortBottom('Error - Save failed. Check your internet connection and try again later.');
      });
    };

    let alert = vm.alertController.create();
    alert.setTitle('Select your team');
    alert.addInput({
      type: 'radio',
      label: 'Instinct',
      value: 'Instinct',
      checked: vm.data.team === 'Instinct'
    });
    alert.addInput({
      type: 'radio',
      label: 'Mystic',
      value: 'Mystic',
      checked: vm.data.team === 'Mystic'
    });
    alert.addInput({
      type: 'radio',
      label: 'Valor',
      value: 'Valor',
      checked: vm.data.team === 'Valor'
    });

    alert.addButton('Cancel');
    alert.addButton({
      text: 'Update',
      handler: data => {
        updateTeam(data);
        return true;
      }
    });
    alert.present();
  };

  showUpdateRadiusPopup = () => {
    var vm = this;
    let radiusModal = vm.modalController.create(RadiusModal, {radius: vm.data.radius});
    radiusModal.onDidDismiss(data => {
      vm.data.radius = this.userData.getRadius();
    });
    radiusModal.present();
  };

  showUpdateBlockListPopup = () => {
    var vm = this;
    if (vm.data.blockedUsers.length === 0) {
      Toast.showShortBottom('There are no users in your block list.');
    } else {
      let blockListModal = vm.modalController.create(BlockListModal, {blockList: vm.data.blockedUsers});
      blockListModal.onDidDismiss(() => {
        vm.data.blockedUsers = this.userData.getBlockList();
      });
      blockListModal.present();
    }
  };

}
