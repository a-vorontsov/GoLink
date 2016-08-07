import {Component} from "@angular/core";
import {ViewController, NavParams, NavController, LoadingController, ToastController} from "ionic-angular/index";
import {MemberProvider} from "../../../../providers/firebase/member.provider";

@Component({
  templateUrl: 'build/pages/settings/modals/radius/radius.modal.html',
  providers: [MemberProvider]
})

export class RadiusModal {
  radius;

  constructor(private viewCtrl: ViewController,
              private nav: NavController,
              private toastController: ToastController,
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
      vm.toastController.create({message: 'The radius must be within 1km and 30km', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
      return;
    }

    vm.showLoading();
    vm.memberProvider.updateRadius(vm.radius).then(() => {
      if (vm.loading) {
        vm.loading.dismiss();
      }
      vm.toastController.create({message: 'Your radius has successfully been updated.', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
      vm.dismiss();
    }).catch(error => {
      if (vm.loading) {
        vm.loading.dismiss();
      }
      vm.toastController.create({message: 'Save failed. Check your internet connection and try again later.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
    });
  };

  dismiss = () => {
    this.viewCtrl.dismiss();
    this.nav.pop();
  };
}
