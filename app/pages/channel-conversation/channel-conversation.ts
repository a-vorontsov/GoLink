import {Component, ViewChild} from '@angular/core';
import {Content, NavController, NavParams, Loading} from 'ionic-angular';
import { Toast } from 'ionic-native';
import {TimestampDirective} from '../../directives/timestamp.directive';
import {ChatInputDirective} from '../../directives/chat-input.directive';
import {DistancePipe} from '../../pipes/distance.pipe';
import {TimestampPipe} from '../../pipes/timestamp.pipe';
import {ChannelConversationProvider} from '../../providers/firebase/channel-conversation.provider';
import {UserData} from '../../providers/user-data/user-data.provider';
import {Helper} from '../../providers/helper/helper.provider';

@Component({
  templateUrl: 'build/pages/channel-conversation/channel-conversation.html',
  pipes: [TimestampPipe, DistancePipe],
  directives: [TimestampDirective, ChatInputDirective],
  providers: [ChannelConversationProvider]
})
export class ChannelConversationPage {

}
