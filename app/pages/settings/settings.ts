import {Component} from '@angular/core';
import {NavController, Alert, Loading, Modal} from 'ionic-angular';
import {UserData} from "../../providers/user-data/user-data.provider";
import {SplashPage} from "../splash/splash";
import {Toast} from "ionic-native/dist/index";
import {RadiusModal} from "./modals/radius/radius.modal";
import {BlockListModal} from "./modals/block-list/block-list.modal";

@Component({
  templateUrl: 'build/pages/settings/settings.html',
})
export class SettingsPage {

  constructor(private nav:NavController,
              private userData:UserData) {

  }

  data = {
    'displayName': this.userData.getDisplayName(),
    'team': this.userData.getTeam(),
    'radius': this.userData.getRadius(),
    'blockedUsers': this.userData.getBlockList(),
    'removedKeys': [],
    'tempBlockedUsers': null
  };

  protected radius;

  private loading;
  showLoading = () => {
    var vm = this;
    vm.loading = Loading.create({dismissOnPageChange: true});
    vm.nav.present(vm.loading);
  };

  signOut = () => {
    var vm = this;
    firebase.auth().signOut().then(function () {
      vm.nav.setRoot(SplashPage);
    }).catch(function (error) {
      Alert.create({title: 'Error', subTitle: 'Unable to sign out. Try again later or clear app data/reinstall the app.', buttons: ['Dismiss']});
    })
  };

  showUpdateDisplayNamePopup = () => {
    var vm = this;

    var updateDisplayName = (displayName) => {
      vm.showLoading();
      var userId = vm.userData.getId();
      firebase.database().ref('members/' + userId + '/display_name').set(displayName, function (error) {
        vm.loading.dismiss();
        if (error) {
          Toast.showShortBottom("Error - Save failed. Check your internet connection and try again later.");
        } else {
          vm.userData.setDisplayName(displayName);
          vm.data.displayName = displayName;
          Toast.showShortBottom(("Your display name has successfully been updated."));
        }
      });
    };

    vm.nav.present(Alert.create({
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
              Toast.showLongBottom("Enter a display name.");
              return false;
            } else if (displayName.length > 16) {
              Toast.showLongBottom("Your display name cannot be greater than 16 characters.");
              return false;
            } else if (displayName == vm.data.displayName) {
              Toast.showLongBottom("Your new display name cannot be the same as your current one.");
              return false;
            } else {
              updateDisplayName(displayName);
              return true;
            }
          }
        }
      ]
    }));
  };

  showUpdateTeamPopup = () => {
    var vm = this;

    var updateTeam = (team) => {
      vm.showLoading();
      var userId = vm.userData.getId();
      firebase.database().ref('members/' + userId + '/team').set(team, function (error) {
        if (vm.loading) {
          vm.loading.dismiss();
        }
        if (error) {
          Toast.showShortBottom("Error - Save failed. Check your internet connection and try again later.");
        } else {
          vm.userData.setTeam(team);
          vm.data.team = team;
          Toast.showShortBottom(("Your team name has successfully been updated."));
        }
      });
    };

    let alert = Alert.create();
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
    vm.nav.present(alert);
  };

  showUpdateRadiusPopup = () => {
    var vm = this;
    let radiusModal = Modal.create(RadiusModal, {radius: vm.data.radius});
    radiusModal.onDismiss(data => {
      vm.data.radius = this.userData.getRadius();
    });
    vm.nav.present(radiusModal);
  };

  showUpdateBlockListPopup = () => {
    var vm = this;
    if (vm.data.blockedUsers.length === 0) {
      Toast.showShortBottom("There are no users in your block list.");
    } else {
      let blockListModal = Modal.create(BlockListModal, {blockList: vm.data.blockedUsers});
      blockListModal.onDismiss(data => {
        vm.data.blockedUsers = this.userData.getBlockList();
      });
      vm.nav.present(blockListModal);
    }
  };

  ionWillEnter() {
    this.data.team = this.userData.getTeam();
  };

}
