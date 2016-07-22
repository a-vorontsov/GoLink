import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {UserData} from "../../providers/user-data/user-data.provider";

@Component({
  templateUrl: 'build/pages/friend-details/friend-details.html',
})
export class FriendDetailsPage {

  private data;

  constructor(private nav:NavController,
              private params:NavParams,
              private userData:UserData) {
    this.data = this.params.get('friend');
  }

}
