import {Injectable} from '@angular/core';
import {AppSettings} from '../../app-settings';
import {Geolocation} from 'ionic-native';

@Injectable()
export class NativeProvider {

  constructor() {
  }

  getFuzzyPosition() {
    return new Promise<Position>((resolve, reject) => {
      Geolocation
        .getCurrentPosition({timeout: AppSettings.CONFIG.MAX_GEOLOCATION_TIME, enableHighAccuracy: false})
        .then(position => {
          resolve(position);
        }).catch(error => {
        reject(error);
      });
    });
  }

  getPrecisePosition() {
    return new Promise<Position>((resolve, reject) => {
      Geolocation
        .getCurrentPosition({timeout: AppSettings.CONFIG.MAX_GEOLOCATION_TIME, enableHighAccuracy: true})
        .then(function (position) {
          resolve(position);
        }).catch(error => {
        reject(error);
      });
    });
  }

}
