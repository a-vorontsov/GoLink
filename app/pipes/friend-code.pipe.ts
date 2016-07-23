import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'friendCode'})
export class FriendCodePipe implements PipeTransform {
  transform(friendCode:any):string {
    if (typeof friendCode === 'undefined' || friendCode === null) {
      return 'N/A (Contact Support)';
    } else {
      return friendCode.substring(0, 4) + '-' + friendCode.substring(4, 8) + '-' + friendCode.substring(8, 12);
    }
  }
}
