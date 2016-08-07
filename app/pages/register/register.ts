import {Component} from "@angular/core";
import {NavController, AlertController, LoadingController} from "ionic-angular";
import {SplashPage} from "../splash/splash";
import {AuthProvider} from "../../providers/firebase/auth.provider";
import FirebaseError = firebase.FirebaseError;

@Component({
  templateUrl: 'build/pages/register/register.html',
  providers: [AuthProvider]
})
export class RegisterPage {

  data: {email?: string, password?: string} = {email: '', password: ''};

  constructor(private nav: NavController,
              private loadingController: LoadingController,
              private alertController: AlertController,
              private authProvider: AuthProvider) {
  }

  private loading;
  showIonicLoading = () => {
    this.loading = this.loadingController.create({'dismissOnPageChange': true});
    this.loading.present();
  };

  hideIonicLoading = () => {
    if (this.loading) {
      setTimeout(() => {
        this.loading.dismiss();
      }, 300);
    }
  };

  register = () => {
    var vm = this;
    var email = vm.data.email;
    var password = vm.data.password;

    if (typeof(email) === 'undefined' || (email.length < 1 || password.length < 1)) {
      vm.alertController.create({title: 'Registration failed', subTitle: 'The credentials you entered are in an invalid format.', buttons: ['Dismiss']}).present();
      return;
    }

    vm.showIonicLoading();
    vm.authProvider.createUserWithEmailAndPassword(email, password).then(user => {
      vm.data.email = '';
      vm.data.password = '';
      vm.hideIonicLoading();
      vm.nav.setRoot(SplashPage);
    }).catch((error: FirebaseError) => {
      vm.hideIonicLoading();
      var errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        vm.alertController.create({title: 'Registration failed', subTitle: 'The email you entered is already in use.', buttons: ['Dismiss']}).present();
      } else if (errorCode === 'auth/invalid-email') {
        vm.alertController.create({title: 'Registration failed', subTitle: 'The email you entered is not in a valid format.', buttons: ['Dismiss']}).present();
      } else if (errorCode === 'auth/weak-password') {
        vm.alertController.create({title: 'Registration failed', subTitle: 'Your password is not strong enough.', buttons: ['Dismiss']}).present();
      } else if (errorCode === 'auth/network-request-failed') {
        vm.alertController.create({title: 'Registration failed', subTitle: 'Failed to connect to the server. Check your internet connection and try again.', buttons: ['Dismiss']}).present();
      } else {
        vm.alertController.create({title: 'Registration failed', subTitle: 'Contact support with the error code: ' + errorCode, buttons: ['Dismiss']}).present();
      }
    });
  }

}
