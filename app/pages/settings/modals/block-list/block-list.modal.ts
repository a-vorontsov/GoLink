import {Component} from "@angular/core";
import {ViewController, NavParams, Alert, Loading, NavController} from "ionic-angular/index";
import {UserData} from "../../../../providers/user-data/user-data.provider";
import {Toast} from "ionic-native/dist/index";

@Component({
  templateUrl: 'build/pages/settings/modals/block-list/block-list.modal.html',
})

export class BlockListModal {
  blockList:any[];
  removedKeys:any[];

  constructor(private viewCtrl:ViewController,
              private nav:NavController,
              private params:NavParams,
              private userData:UserData) {
    this.blockList = this.params.get('blockList');
    this.removedKeys = [];
  }

  private loading;

  private showLoading() {
    this.loading = Loading.create({dismissOnPageChange: true});
    this.nav.present(this.loading);
  }

  update() {
    var vm = this;
    vm.showLoading();
    var blockListUpdates = {};
    vm.removedKeys.forEach(function (removedKey) {
      blockListUpdates[removedKey] = null;
    });

    firebase.database().ref('block_list/' + vm.userData.getId()).update(blockListUpdates, function (error) {
      vm.removedKeys = [];
      if (vm.loading) {
        vm.loading.dismiss();
      }
      if (error) {
        Toast.showShortBottom("Save failed. Check your internet connection and try again later.");
      } else {
        vm.userData.setBlockList(vm.blockList);
        vm.userData.setIsBlockListStale(true);
        Toast.showLongBottom("Your block list has successfully been updated.");
        vm.dismiss();
      }
    });
  };

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
