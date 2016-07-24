import {Injectable} from '@angular/core';
import {UserData} from '../user-data/user-data.provider';
import User = firebase.User;

@Injectable()
export class AuthProvider {

  constructor(private userData: UserData) {
  }

  /**
   * Gets the authenticated user
   * @returns firebase.User | null
   * @throws firebase.auth.Error
   * @link https://firebase.google.com/docs/reference/js/firebase.User
   * @link https://firebase.google.com/docs/reference/js/firebase.auth.Error
   */
  getAuthenticatedUser() {
    return new Promise<User>((resolve, reject) => {
      var unsubscribe = firebase.auth().onAuthStateChanged(user => {
        resolve(user);
        unsubscribe();
      }, error => {
        reject(error);
      });
    });
  }

  signInWithEmailAndPassword(email, password) {
    return new Promise<User>((resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(email, password).then(user => {
        resolve(user);
      }).catch(error => {
        reject(error);
      });
    });
  }

  createUserWithEmailAndPassword(email, password) {
    return new Promise<User>((resolve, reject) => {
      firebase.auth().createUserWithEmailAndPassword(email, password).then(user => {
        resolve(user);
      }).catch(error => {
        reject(error);
      });
    });
  }

}

