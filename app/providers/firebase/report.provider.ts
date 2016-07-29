import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';

@Injectable()
export class ReportProvider {

  constructor(private userData: UserData) {
  }

  addReport(targetType: string, targetId: string, reason: string) {
    return new Promise((resolve, reject) => {
      var vm = this;
      firebase.database().ref('reports').push({
        processed: false,
        reported_by: vm.userData.getId(),
        target_type: targetType,
        target_id: targetId,
        reason: reason,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      }).then(() => {
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

}
