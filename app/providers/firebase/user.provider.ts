import {Injectable} from '@angular/core';
import {UserData} from "../user-data/user-data.provider";

@Injectable()
export class UserProvider {

  constructor(private userData:UserData) {
  }

  getUserStatus() {
    return new Promise((resolve, reject) => {

    });
  }

}

