import {Component} from "@angular/core";
import {NavController, AlertController, LoadingController} from "ionic-angular";
import {RegisterPage} from "../register/register";
import {ForgotPasswordPage} from "../forgot-password/forgot-password";
import {SplashPage} from "../splash/splash";
import {AuthProvider} from "../../providers/firebase/auth.provider";
import FirebaseError = firebase.FirebaseError;

@Component({
  templateUrl: 'build/pages/login/login.html',
  providers: [AuthProvider]
})
export class LoginPage {
  private forgotPasswordPage;
  private registerPage;

  data: {email?: string, password?: string} = {email: '', password: ''};

  constructor(private nav: NavController,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private authProvider: AuthProvider) {
    this.registerPage = RegisterPage;
    this.forgotPasswordPage = ForgotPasswordPage;
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

  login() {
    var vm = this;

    var email = vm.data.email;
    var password = vm.data.password;

    if (typeof(email) === 'undefined' || (email.length < 1 || password.length < 1)) {
      vm.alertController.create({title: 'Login failed', subTitle: 'The credentials you entered are invalid.', buttons: ['Dismiss']}).present();
      return;
    }

    vm.showIonicLoading();
    vm.authProvider.signInWithEmailAndPassword(email, password).then(function (user) {
      vm.data.email = '';
      vm.data.password = '';
      vm.hideIonicLoading();
      vm.nav.setRoot(SplashPage);

    }).catch((error: FirebaseError) => {
      vm.hideIonicLoading();
      var errorCode = error.code;
      if (errorCode === 'auth/user-disabled') {
        vm.alertController.create({title: 'Login failed', subTitle: 'Your account has been disabled. Contact support for more info.', buttons: ['Dismiss']}).present();
      } else if (errorCode === 'auth/network-request-failed') {
        vm.alertController.create({title: 'Login failed', subTitle: 'Unable to connect to the server. Check your internet connection and try again.', buttons: ['Dismiss']}).present();
      } else {
        vm.alertController.create({title: 'Login failed', subTitle: 'The credentials you entered are invalid.', buttons: ['Dismiss']}).present();
      }
    });
  }
}
