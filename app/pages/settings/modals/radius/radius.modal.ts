import {Component} from "@angular/core";
import {ViewController, NavParams, NavController, LoadingController} from "ionic-angular/index";
import {Toast} from "ionic-native";
import {MemberProvider} from "../../../../providers/firebase/member.provider";

@Component({
  templateUrl: 'build/pages/settings/modals/radius/radius.modal.html',
  providers: [MemberProvider]
})

export class RadiusModal {
  radius;

  constructor(private viewCtrl: ViewController,
              private nav: NavController,
              private loadingController: LoadingController,
              private params: NavParams,
              private memberProvider: MemberProvider) {
    this.radius = this.params.get('radius');
  }

  private loading;

  private showLoading() {
    this.loading = this.loadingController.create({dismissOnPageChange: true});
    this.loading.present();
  }

  update = () => {
    var vm = this;
    if (vm.radius > 30 || vm.radius < 1) {
      Toast.showShortBottom('The radius must be within 1km and 30km');
      return;
    }

    vm.showLoading();
    vm.memberProvider.updateRadius(vm.radius).then(() => {
      if (vm.loading) {
        vm.loading.dismiss();
      }
      Toast.showLongBottom('Your radius has successfully been updated.');
      vm.dismiss();
    }).catch(error => {
      if (vm.loading) {
        vm.loading.dismiss();
      }
      Toast.showShortBottom('Save failed. Check your internet connection and try again later.');
    });
  };

  dismiss = () => {
    this.viewCtrl.dismiss();
    this.nav.pop();
  };
}
