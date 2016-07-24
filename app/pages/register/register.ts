import {Component} from "@angular/core";
import {NavController, Loading, Alert} from "ionic-angular";
import {LoginPage} from "../login/login";
import {SplashPage} from "../splash/splash";

@Component({
  templateUrl: 'build/pages/register/register.html',
})
export class RegisterPage {

  data:{email?:string, password?:string} = {email: '', password: ''};

  constructor(private nav:NavController) {
  }

  private loading;
  showIonicLoading = () => {
    this.loading = Loading.create({'dismissOnPageChange': true});
    this.nav.present(this.loading);
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
    var nav = vm.nav;
    var email = vm.data.email;
    var password = vm.data.password;

    if (typeof(email) === 'undefined' || (email.length < 1 || password.length < 1)) {
      nav.present(Alert.create({title: "Registration failed", subTitle: "The credentials you entered are in an invalid format.", buttons: ['Dismiss']}));
      return;
    }

    vm.showIonicLoading();
    firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
      vm.data.email = '';
      vm.data.password = '';
      vm.hideIonicLoading();
      nav.setRoot(SplashPage);
    }).catch(function (error) {
      vm.hideIonicLoading();
      var errorCode = error.code;
      if (errorCode === "auth/email-already-in-use") {
        nav.present(Alert.create({title: "Registration failed", subTitle: "The email you entered is already in use.", buttons: ['Dismiss']}));
      } else if (errorCode === "auth/invalid-email") {
        nav.present(Alert.create({title: "Registration failed", subTitle: "The email you entered is not in a valid format.", buttons: ['Dismiss']}));
      } else if (errorCode === "auth/weak-password") {
        nav.present(Alert.create({title: "Registration failed", subTitle: "Your password is not strong enough.", buttons: ['Dismiss']}));
      } else if (errorCode === "auth/network-request-failed") {
        nav.present(Alert.create({title: "Registration failed", subTitle: "Failed to connect to the server. Check your internet connection and try again.", buttons: ['Dismiss']}));
      } else {
        nav.present(Alert.create({title: 'Registration failed', subTitle: 'Contact support with the error code: ' + errorCode, buttons: ['Dismiss']}));
      }
    });
  }

}