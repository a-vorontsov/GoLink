import {Component} from "@angular/core";
import {ViewController, NavParams, Alert, Loading, NavController} from "ionic-angular/index";
import {UserData} from "../../../../providers/user-data/user-data.provider";
import {Toast} from "ionic-native/dist/index";

@Component({
  templateUrl: 'build/pages/settings/modals/radius/radius.modal.html',
})

export class RadiusModal {
  radius;

  constructor(private viewCtrl:ViewController,
              private nav:NavController,
              private params:NavParams,
              private userData:UserData) {
    this.radius = this.params.get('radius');
  }

  private loading;

  private showLoading() {
    this.loading = Loading.create({dismissOnPageChange: true});
    this.nav.present(this.loading);
  }

  update = () => {
    var vm = this;
    if (vm.radius > 30 || vm.radius < 1) {
      Toast.showShortBottom('The radius must be within 1km and 30km');
      return;
    }

    var user = firebase.auth().currentUser;
    firebase.database().ref('members/' + vm.userData.getId() + '/radius').set(vm.radius, function (error) {
      if (vm.loading) {
        vm.loading.dismiss();
      }
      if (error) {
        Toast.showShortBottom("Save failed. Check your internet connection and try again later.");
      } else {
        vm.userData.setRadius(vm.radius);
        Toast.showLongBottom("Your radius has successfully been updated.");
        vm.dismiss();
      }
    });
  };

  dismiss = () => {
    this.viewCtrl.dismiss();
  };
}
