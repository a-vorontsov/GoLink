import {Component} from '@angular/core';
import {Platform, ionicBootstrap} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {SplashPage} from './pages/splash/splash';
import {UserData} from './providers/user-data/user-data.provider';
import {Helper} from './providers/helper/helper.provider';


@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>'
})
export class MyApp {

  private rootPage: any;

  constructor(private platform: Platform) {
    this.rootPage = SplashPage;

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();

      // Initialize the Firebase SDK
      var config = {
        apiKey: "API_KEY_HERE",
        authDomain: "AUTH_DOMAIN_HERE.firebaseapp.com",
        databaseURL: "https://DATABASE_URL_HERE.firebaseio.com",
        storageBucket: ""
      };
      firebase.initializeApp(config);
    });
  }
}

ionicBootstrap(MyApp, [UserData, Helper], {
  platforms: {
    android: {
      tabsPlacement: 'top'
    }
  }
});
