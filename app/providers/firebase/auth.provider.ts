import {Injectable} from "@angular/core";
import {UserData} from "../user-data/user-data.provider";
import User = firebase.User;

@Injectable()
export class AuthProvider {

  constructor(private userData:UserData) {
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
      var unsubscribe = firebase.auth().onAuthStateChanged(function (user) {
        resolve(user);
        unsubscribe();
      }, function(error) {
        reject(error);
      });
    });
  }

}

