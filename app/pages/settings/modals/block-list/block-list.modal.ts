import {Component} from '@angular/core';
import {ViewController, NavParams, Loading, NavController} from 'ionic-angular/index';
import {Toast} from 'ionic-native';
import {MemberProvider} from '../../../../providers/firebase/member.provider';

@Component({
  templateUrl: 'build/pages/settings/modals/block-list/block-list.modal.html',
  providers: [MemberProvider]
})

export class BlockListModal {
  blockList: any[];
  oldBlockList: any[];
  removedKeys: any[];

  constructor(private viewCtrl: ViewController,
              private nav: NavController,
              private params: NavParams,
              private memberProvider: MemberProvider) {
    this.oldBlockList = this.params.get('blockList');
    this.blockList = this.oldBlockList.slice(0);
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

    vm.memberProvider.setBlockListUpdates(blockListUpdates, vm.blockList).then(() => {
      vm.removedKeys = [];
      if (vm.loading) {
        vm.loading.dismiss();
      }
      Toast.showLongBottom('Your block list has successfully been updated.');
      vm.dismiss();
    }).catch(error => {
      vm.removedKeys = [];
      if (vm.loading) {
        vm.loading.dismiss();
      }
      Toast.showShortBottom('Save failed. Check your internet connection and try again later.');
    });
  };

  dismiss = () => {
    this.viewCtrl.dismiss();
    this.nav.pop();
  }
}
