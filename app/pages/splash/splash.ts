import {Component} from "@angular/core";
import {NavController, Alert} from "ionic-angular";
import {AppSettings} from "../../app-settings";
import {UserData} from "../../providers/user-data/user-data.provider";
import {SetupPage} from "../setup/setup";
import {LoginPage} from "../login/login";
import {Geolocation} from "ionic-native";
import {TabsPage} from "../tabs/tabs";

@Component({
  templateUrl: 'build/pages/splash/splash.html',
})
export class SplashPage {
  constructor(private nav:NavController, private userData:UserData) {

  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.checkUser();
    }, 3000);
  }

  checkUser = () => {
    var userData = this.userData;
    var nav = this.nav;
    var onUserConfigured = this.onUserConfigured;
    var onUserMissingFriendCode = this.onUserMissingFriendCode;

    var unsubscribe = firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // Update user data service
        userData.setId(user.uid);
        // Check whether the user has gone through the setup process
        firebase.database().ref('/members/' + user.uid).once('value').then(snapshot => {
          if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('radius') && snapshot.hasChild('team')
            && snapshot.hasChild('friend_code') && snapshot.child('friend_code').val().length === AppSettings.CONFIG['FRIEND_CODE_LENGTH']) {
            onUserConfigured(snapshot);
            unsubscribe();
          } else if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('radius') && snapshot.hasChild('team')) {
            onUserMissingFriendCode();
            unsubscribe();
          } else {
            nav.setRoot(SetupPage);
            unsubscribe();
          }
        }, function (error) {
          nav.present(Alert.create({title: "Error", subTitle: "Unable to retrieve your user details. Check your internet connection and restart the app.", buttons: ['Dismiss']}));
          unsubscribe();
        });
      } else {
        nav.setRoot(LoginPage);
        unsubscribe();
      }
    });
  };

  /*
   * Events
   */

  onUserConfigured = (snapshot) => {
    var userData = this.userData;
    var nav = this.nav;

    // Update user data service
    var memberSnapshot = snapshot.val();
    userData.setDisplayName(memberSnapshot.display_name);
    userData.setTeam(memberSnapshot.team);
    userData.setRadius(memberSnapshot.radius);
    userData.setFriendCode(memberSnapshot.friend_code);

    // Attempt to retrieve location
    Geolocation
      .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
      .then(position => {
        // Set coordinates
        userData.setCoordinates([position.coords.latitude, position.coords.longitude]);

        // Attempt to retrieve block list
        firebase.database().ref('block_list/' + userData.getId()).once('value').then(snapshot => {
          var snapshotBlockList = snapshot.val();
          var blockList = [];
          for (var key in snapshotBlockList) {
            blockList.push({
              'user_id': key,
              'display_name': snapshotBlockList[key].display_name,
              'blocked_at': snapshotBlockList[key].blocked_at
            });
          }
          userData.setBlockList(blockList);

          // Navigate to the main tab view
          nav.setRoot(TabsPage);
        }, function (error) {
          nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve your user details. Check your internet connectivity and restart the app.', buttons: ['Dismiss']}));
        });

      }, function (error) {
        nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve location. Ensure location services are enabled and restart app.', buttons: ['Dismiss']}));
      });
  };

  onUserMissingFriendCode = () => {
    this.insertFriendCode();
  };

  /*
   * Friend Code
   */
  generateFriendCode = ():string => {
    var friendCode = '';
    for (var i = 0; i < 12; i++) {
      friendCode += Math.floor(Math.random() * 10).toString();
    }
    return friendCode;
  };

  insertFriendCode = () => {
    var nav = this.nav;
    var userData = this.userData;
    var insertFriendCode = this.insertFriendCode;
    var generateFriendCode = this.generateFriendCode;
    var checkUser = this.checkUser;

    var attemptCounter = 0;
    var friendCode = generateFriendCode();
    firebase.database().ref('friend_codes/' + friendCode).set({'user_id': userData.getId()}, function (error) {
      if (error) {
        attemptCounter++;
        if (attemptCounter < AppSettings.CONFIG['MAX_FRIEND_CODE_GENERATION_ATTEMPTS']) {
          insertFriendCode();
        } else {
          nav.present(Alert.create({title: "Error", subTitle: "Unable to retrieve your friend code. Check your internet connection and restart the app.", buttons: ['Dismiss']}));
        }
      } else {
        firebase.database().ref('members/' + userData.getId() + '/friend_code').set(friendCode, function (error) {
          if (error) {
            attemptCounter++;
            if (attemptCounter < AppSettings.CONFIG['MAX_FRIEND_CODE_GENERATION_ATTEMPTS']) {
              insertFriendCode();
            } else {
              nav.present(Alert.create({title: "Error", subTitle: "Unable to retrieve your friend code. Check your internet connection and restart the app.", buttons: ['Dismiss']}));
            }
          } else {
            checkUser();
          }
        });
      }
    });
  }
}
