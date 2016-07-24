import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'timestamp'})
export class TimestampPipe implements PipeTransform {
  transform(timestamp:any):string {
    if (typeof timestamp === 'undefined' || timestamp === null || timestamp === '' || timestamp === 0) {
      return 'never';
    } else {
      return moment(timestamp).fromNow();
    }
  }
}
