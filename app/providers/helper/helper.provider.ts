import {Injectable} from '@angular/core';
import {Platform} from 'ionic-angular/index';
import {DomSanitizationService} from '@angular/platform-browser';

@Injectable()
export class Helper {
  constructor(private platform: Platform,
              private sanitizer: DomSanitizationService) {

  }

  getConversationId(userId, friendUserId) {
    if (userId < friendUserId) {
      return userId + '+' + friendUserId;
    } else {
      return friendUserId + '+' + userId;
    }
  }

  getFriendUserIdFromConversationId(userId, conversationId) {
    return conversationId.replace(userId, '').replace('+', '');
  }

  getGeoUriFromCoordinates(latitude, longitude) {
    if (this.platform.is('ios')) {
      return this.sanitizer.bypassSecurityTrustUrl('maps:?q=' + latitude + ',' + longitude);
    } else {
      return this.sanitizer.bypassSecurityTrustUrl('geo:?q=' + latitude + ',' + longitude);
    }
  }

  getSrcfromCoordinates(latitude, longitude) {
    return 'http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=16&scale=2&size=400x200&maptype=roadmap&format=png&markers=size:mid|color:0xff0000|label:|' + latitude + ',' + longitude + '&style=element:geometry.stroke|visibility:off&style=feature:landscape|element:geometry|saturation:-100&style=feature:water|saturation:-100|invert_lightness:true_';
  }
}
