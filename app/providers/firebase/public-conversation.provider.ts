import {Injectable} from '@angular/core';
import {UserData} from "../user-data/user-data.provider";

@Injectable()
export class PublicConversationProvider {

  constructor(private userData:UserData) {
  }

}

