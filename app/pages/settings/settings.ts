import {Component} from '@angular/core';
import {NavController, Alert, Loading} from 'ionic-angular';
import {UserData} from "../../providers/user-data/user-data.provider";
import {SplashPage} from "../splash/splash";
import {Toast} from "ionic-native/dist/index";

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
    'newDisplayName': this.userData.getDisplayName(),
    'newTeam': this.userData.getTeam(),
    'newRadius': this.userData.getRadius(),
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
          vm.data.newDisplayName = vm.data.displayName;
          Toast.showShortBottom("Error - Save failed. Check your internet connection and try again later.");
        } else {
          vm.userData.setDisplayName(displayName);
          vm.data.displayName = displayName;
          Toast.showShortBottom(("Your display name has successfully been updated."));
        }
      });
    };

    vm.nav.present(Alert.create({
      title: 'Enter new display name',
      inputs: [
        {
          name: 'displayName',
          placeholder: ''
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {}
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
        vm.loading.dismiss();
        if (error) {
          Toast.showShortBottom("Error - Save failed. Check your internet connection and try again later.");
          vm.data.newDisplayName = vm.data.displayName;
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

/*  updateRadius = () => {
    var vm = this;
    vm.radius = parseInt(vm.data.newRadius, 10);

    vm.showLoading();
    var userId = vm.userData.getId();
    firebase.database().ref('members/' + userId + '/radius').set(radius, function (error) {
      vm.loading.dismiss();
      if (error) {
        $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
        vm.data.newRadius = vm.data.radius;
      } else {
        vm.userData.setRadius(radius);
        vm.data.radius = radius;
        $ionicPopup.alert({title: 'Radius updated', template: 'Your radius has been updated.'});
      }
    });
  };

  showUpdateRadiusPopup = () => {
    Alert.create()
    var vm = this;
    $ionicPopup.show({
      template: '<input type="range" step="1" min="1" max="30" value="15" ng-model="data.newRadius"/><span class="">{{data.newRadius}}</span>',
      title: 'Select the radius of trainers around you to be shown',
      scope: vm,
      buttons: [
        {text: 'Cancel'},
        {
          text: '<b>Update</b>',
          type: 'button-positive',
          onTap: function (e) {
            var radius = parseInt(vm.data.newRadius, 10);
            if (isNaN(radius) || (radius > 30 || radius < 1)) {
              $ionicPopup.alert({title: "Validation failed", template: "The radius must be within 1km and 30km."});
              e.preventDefault();
            } else {
              vm.updateRadius();
            }
          }
        }
      ]
    });
  };

  updateBlockList = () => {
    var vm = this;
    vm.showLoading();
    var blockListUpdates = {};
    vm.data.removedKeys.forEach(function (removedKey) {
      blockListUpdates[removedKey] = null;
    });

    firebase.database().ref('block_list/' + vm.userData.getId()).update(blockListUpdates, function (error) {
      vm.data.removedKeys = [];
      if (error) {
        vm.loading.dismiss();
        $ionicPopup.alert({title: "Error", template: "Your block list could not be modified. Check your internet connection and try again."});
      } else {
        vm.data.blockedUsers = vm.data.tempBlockedUsers;
        vm.userData.setBlockList(vm.data.blockedUsers);
        vm.userData.setIsBlockListStale(true);
        vm.loading.dismiss();
        $ionicPopup.alert({title: 'Block list updated', template: 'Your block list has been updated.'});
      }
    });
  };

  showUpdateBlockListPopup = () => {
    var vm = this;
    vm.data.tempBlockedUsers = vm.data.blockedUsers;
    if (vm.data.blockedUsers.length === 0) {
      $ionicPopup.alert({title: "No users blocked", template: "There are no users in your block list."});
    } else {
      $ionicPopup.show({
        templateUrl: '/templates/blockList.html',
        title: 'Block List',
        scope: vm,
        buttons: [
          {text: 'Cancel'},
          {
            text: '<b>Update</b>',
            type: 'button-positive',
            onTap: function (e) {
              vm.updateBlockList();
            }
          }
        ]
      });
    }
  }*/

}
