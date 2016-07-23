import {Component} from "@angular/core";
import {SettingsPage} from "../settings/settings";
import {PokedexPage} from "../pokedex/pokedex";
import {FriendsPage} from "../friends/friends";
import {PublicConversationPage} from "../public-conversation/public-conversation";

@Component({
  templateUrl: 'build/pages/tabs/tabs.html'
})
export class TabsPage {

  private tab1Root:any;
  private tab2Root:any;
  private tab3Root:any;
  private tab4Root:any;

  constructor() {
    this.tab1Root = PublicConversationPage;
    this.tab2Root = FriendsPage;
    this.tab3Root = PokedexPage;
    this.tab4Root = SettingsPage;
  }
}
