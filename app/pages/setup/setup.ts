import {Component} from '@angular/core';
import {NavController, Loading, Alert} from 'ionic-angular';
import {SplashPage} from '../splash/splash';

@Component({
  templateUrl: 'build/pages/setup/setup.html',
})
export class SetupPage {

  private loading;

  private teams = ['Instinct', 'Mystic', 'Valor'];
  data: {displayName?: string, team?: string, radius?: number} = {displayName: '', team: 'Instinct', radius: 15};

  constructor(private nav: NavController) {
    this.loading = Loading.create({dismissOnPageChange: true});
  }

  sendSetup = () => {
    var vm = this;
    var nav = vm.nav;
    var loading = vm.loading;

    var displayName = vm.data.displayName;
    var team = vm.data.team;
    var radius = vm.data.radius;

    if (displayName.length < 1) {
      nav.present(Alert.create({title: 'Validation failed', subTitle: 'Enter a display name.', buttons: ['Dismiss']}));
      return;
    } else if (displayName.length > 16) {
      nav.present(Alert.create({title: 'Validation failed', subTitle: 'Your display name cannot be greater than 16 characters.', buttons: ['Dismiss']}));
      return;
    } else if (vm.teams.indexOf(team) === -1) {
      nav.present(Alert.create({title: 'Validation failed', subTitle: 'Select a valid team.', buttons: ['Dismiss']}));
      return;
    } else if (isNaN(radius) || (radius > 30 || radius < 1)) {
      nav.present(Alert.create({title: 'Validation failed', subTitle: 'The radius must be within 1km and 30km.', buttons: ['Dismiss']}));
      return;
    }

    nav.present(loading);
    var user = firebase.auth().currentUser;
    firebase.database().ref('members/' + user.uid).set({
      'display_name': displayName,
      'team': team,
      'radius': radius
    }, function (error) {
      loading.dismiss();
      if (error) {
        nav.present(Alert.create({title: 'Error', subTitle: 'Save failed. Try again later.', buttons: ['Dismiss']}));
      } else {
        nav.setRoot(SplashPage);
      }
    });
  }


}
