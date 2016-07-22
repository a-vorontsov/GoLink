import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {UserData} from "../../providers/user-data/user-data.provider";

@Component({
  templateUrl: 'build/pages/friend-details/friend-details.html',
})
export class FriendDetailsPage {

  constructor(private nav:NavController,
              private userData:UserData) {

  }

}
