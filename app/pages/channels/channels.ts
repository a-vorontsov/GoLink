import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {ChannelsProvider} from '../../providers/firebase/channels.provider';

@Component({
  templateUrl: 'build/pages/channels/channels.html',
  providers: [ChannelsProvider]
})
export class ChannelsPage {

  constructor(private nav: NavController,
              private channelsProvider: ChannelsProvider) {

  }



}
