import {Component} from "@angular/core";
import {NavController, Loading, AlertController, LoadingController} from "ionic-angular";
import {SplashPage} from "../splash/splash";
import {MemberProvider} from "../../providers/firebase/member.provider";

@Component({
  templateUrl: 'build/pages/setup/setup.html',
  providers: [MemberProvider]
})
export class SetupPage {

  constructor(private nav: NavController,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private memberProvider: MemberProvider) {
  }

  private loading: Loading;
  private showIonicLoading = () => {
    this.loading = this.loadingController.create({dismissOnPageChange: true});
    this.loading.present();
  };

  private hideIonicLoading = () => {
    if (this.loading) {
      setTimeout(() => {
        this.loading.dismiss();
      }, 300);
    }
  };

  private teams = ['Instinct', 'Mystic', 'Valor'];
  data: {displayName?: string, team?: string, radius?: number} = {displayName: '', team: 'Instinct', radius: 15};


  sendSetup = () => {
    var vm = this;

    var displayName = vm.data.displayName;
    var team = vm.data.team;
    var radius = vm.data.radius;

    if (displayName.length < 1) {
      vm.alertController.create({title: 'Validation failed', subTitle: 'Enter a display name.', buttons: ['Dismiss']}).present();
      return;
    } else if (displayName.length > 16) {
      vm.alertController.create({title: 'Validation failed', subTitle: 'Your display name cannot be greater than 16 characters.', buttons: ['Dismiss']}).present();
      return;
    } else if (vm.teams.indexOf(team) === -1) {
      vm.alertController.create({title: 'Validation failed', subTitle: 'Select a valid team.', buttons: ['Dismiss']}).present();
      return;
    } else if (isNaN(radius) || (radius > 30 || radius < 1)) {
      vm.alertController.create({title: 'Validation failed', subTitle: 'The radius must be within 1km and 30km.', buttons: ['Dismiss']}).present();
      return;
    }

    vm.showIonicLoading();

    vm.memberProvider.setMemberDetails({
      'display_name': displayName,
      'team': team,
      'radius': radius
    }).then(() => {
      vm.hideIonicLoading();
      vm.nav.setRoot(SplashPage);
    }).catch(error => {
      vm.hideIonicLoading();
      vm.alertController.create({title: 'Error', subTitle: 'Save failed. Try again later.', buttons: ['Dismiss']}).present();
    });
  }


}
