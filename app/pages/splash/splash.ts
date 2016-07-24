import {Component} from '@angular/core';
import {NavController, Alert} from 'ionic-angular';
import {AppSettings} from '../../app-settings';
import {UserData} from '../../providers/user-data/user-data.provider';
import {SetupPage} from '../setup/setup';
import {LoginPage} from '../login/login';
import {TabsPage} from '../tabs/tabs';
import {AuthProvider} from '../../providers/firebase/auth.provider';
import {MemberProvider} from '../../providers/firebase/member-provider';
import {NativeProvider} from '../../providers/native-provider/native-provider';

@Component({
  templateUrl: 'build/pages/splash/splash.html',
  providers: [AuthProvider, MemberProvider, NativeProvider]
})
export class SplashPage {
  constructor(private nav: NavController,
              private userData: UserData,
              private authProvider: AuthProvider,
              private memberProvider: MemberProvider,
              private nativeProvider: NativeProvider) {

  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.checkUser();
    }, 3000);
  }

  checkUser = () => {
    var vm = this;

    var userData = vm.userData;
    var nav = vm.nav;
    var onUserConfigured = vm.onUserConfigured;
    var onUserMissingFriendCode = vm.onUserMissingFriendCode;

    vm.authProvider.getAuthenticatedUser().then(user => {
      if (user) {
        // Update user data service
        userData.setId(user.uid);

        // Check whether the user has gone through the setup process
        vm.memberProvider.getMemberSnapshot().then(snapshot => {
          var status = vm.memberProvider.getUserStatusFromMemberSnapshot(snapshot);
          if (status === AppSettings.INFO.USER_OK) {
            onUserConfigured(snapshot.val());
          } else if (status === AppSettings.INFO.USER_NEEDS_FRIEND_CODE) {
            onUserMissingFriendCode();
          } else {
            nav.setRoot(SetupPage);
          }
        }).catch(error => {
          nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve your user details. Check your internet connection and restart the app.', buttons: ['Dismiss']}));
        });
      } else {
        nav.setRoot(LoginPage);
      }
    });
  };

  /*
   * Events
   */

  onUserConfigured = (memberData) => {
    var vm = this;

    var userData = vm.userData;
    var nav = vm.nav;

    // Update user data service
    userData.setDisplayName(memberData.display_name);
    userData.setTeam(memberData.team);
    userData.setRadius(memberData.radius);
    userData.setFriendCode(memberData.friend_code);
    // Attempt to retrieve location
    vm.nativeProvider.getFuzzyPosition().then(position => {
      // Set coordinates
      userData.setCoordinates([position.coords.latitude, position.coords.longitude]);

      // Return promise to set block list
      return vm.memberProvider.getTransformedBlockListObject();
    }, function (error) {
      nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve location. Ensure location services are enabled and restart app.', buttons: ['Dismiss']}));
      return null;
    }).then(blockList => {
      // Set the block list
      userData.setBlockList(blockList);

      // Navigate to the main tab view
      nav.setRoot(TabsPage);
    }, function (error) {
      nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve your user details. Check your internet connectivity and restart the app.', buttons: ['Dismiss']}));
    });
  };

  onUserMissingFriendCode = () => {
    var vm = this;

    vm.memberProvider.createFriendCode().then(() => {
      vm.checkUser();
    }).catch(error => {
      vm.nav.present(Alert.create({title: 'Error', subTitle: 'Unable to retrieve your friend code. Check your internet connection and restart the app.', buttons: ['Dismiss']}));
    });
  };
}
