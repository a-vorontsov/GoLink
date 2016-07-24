import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'distance'})
export class DistancePipe implements PipeTransform {
  transform(distance: number): string {
    if (distance < 1) {
      return '<1km away';
    } else {
      return Math.round(distance) + 'km away';
    }
  }
}
