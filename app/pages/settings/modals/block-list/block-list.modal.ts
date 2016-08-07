import {Component} from "@angular/core";
import {ViewController, NavParams, NavController, LoadingController, ToastController} from "ionic-angular/index";
import {MemberProvider} from "../../../../providers/firebase/member.provider";

@Component({
  templateUrl: 'build/pages/settings/modals/block-list/block-list.modal.html',
  providers: [MemberProvider]
})

export class BlockListModal {
  blockList: any[];
  oldBlockList: any[];
  removedKeys: any[];

  constructor(private viewCtrl: ViewController,
              private loadingController: LoadingController,
              private nav: NavController,
              private toastController: ToastController,
              private params: NavParams,
              private memberProvider: MemberProvider) {
    this.oldBlockList = this.params.get('blockList');
    this.blockList = this.oldBlockList.slice(0);
    this.removedKeys = [];
  }

  private loading;

  private showLoading() {
    this.loading = this.loadingController.create({dismissOnPageChange: true});
    this.loading.present();
  }

  update() {
    var vm = this;
    vm.showLoading();
    var blockListUpdates = {};
    vm.removedKeys.forEach(function (removedKey) {
      blockListUpdates[removedKey] = null;
    });

    vm.memberProvider.setBlockListUpdates(blockListUpdates, vm.blockList).then(() => {
      vm.removedKeys = [];
      if (vm.loading) {
        vm.loading.dismiss();
      }
      vm.toastController.create({message: 'Your block list has successfully been updated.', duration: 5000, position: 'bottom', dismissOnPageChange : true}).present();
      vm.dismiss();
    }).catch(error => {
      vm.removedKeys = [];
      if (vm.loading) {
        vm.loading.dismiss();
      }
      vm.toastController.create({message: 'Save failed. Check your internet connection and try again later.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
    });
  };

  dismiss = () => {
    this.viewCtrl.dismiss();
    this.nav.pop();
  }
}
