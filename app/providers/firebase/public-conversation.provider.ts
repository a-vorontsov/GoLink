import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';
import Reference = firebase.database.Reference;
import DataSnapshot = firebase.database.DataSnapshot;

@Injectable()
export class PublicConversationProvider {

  constructor(private userData: UserData) {
  }

  getPublicMessageLocationRef(): Reference {
    return firebase.database().ref('public_message_locations');
  }

  getSnapshotForMessageKey(key: string) {
    return new Promise<DataSnapshot>((resolve, reject) => {
      firebase.database().ref('/public_messages/' + key).once('value').then(snapshot => {
        resolve(snapshot);
      }).catch(error => {
        reject(error);
      });
    });
  }

  getNewMessageRef(): Reference {
    return firebase.database().ref('public_messages').push();
  }

  setMessageForRef(newMessageRef: Reference, data: PublicConversationMessage) {
    return new Promise<any>((resolve, reject) => {
      newMessageRef.set(data).then(() => {
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

}
