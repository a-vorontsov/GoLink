import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'timestamp'})
export class TimestampPipe implements PipeTransform {
  transform(timestamp:any):string {
    if (typeof timestamp === 'undefined' || timestamp === null || timestamp === '') {
      return 'never';
    } else {
      return moment(timestamp).fromNow();
    }
  }
}
