import {Component} from '@angular/core';
import {NavController, Alert, Loading} from 'ionic-angular';
import {RegisterPage} from "../register/register";
import {ForgotPasswordPage} from "../forgot-password/forgot-password";
import {UserData} from "../../providers/user-data/user-data.provider";
import {SplashPage} from "../splash/splash";

@Component({
  templateUrl: 'build/pages/login/login.html',
})
export class LoginPage {
  private forgotPasswordPage;
  private registerPage;

  private loading;

  data:{email?:string, password?:string} = {email: '', password: ''};

  constructor(private nav:NavController, private userData:UserData) {
    this.loading = Loading.create({'dismissOnPageChange': true});
    this.registerPage = RegisterPage;
    this.forgotPasswordPage = ForgotPasswordPage;
  }

  login() {
    var vm = this;
    var nav = vm.nav;
    var loading = vm.loading;

    var email = vm.data.email;
    var password = vm.data.password;

    if (typeof(email) === 'undefined' || (email.length < 1 || password.length < 1)) {
      nav.present(Alert.create({title: "Login failed", subTitle: "The credentials you entered are invalid.", buttons: ['Dismiss']}));
      return;
    }

    nav.present(loading);
    firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
      vm.data.email = '';
      vm.data.password = '';
      loading.dismiss();
      nav.setRoot(SplashPage);

    }).catch(function (error) {
      loading.dismiss();
      var errorCode = error.code;
      if (errorCode === "auth/user-disabled") {
        nav.present(Alert.create({title: "Login failed", subTitle: "Your account has been disabled. Contact support for more info.", buttons: ['Dismiss']}));
      } else if (errorCode === "auth/network-request-failed") {
        nav.present(Alert.create({title: "Login failed", subTitle: "Unable to connect to the server. Check your internet connection and try again.", buttons: ['Dismiss']}));
      } else {
        console.log(errorCode);
        nav.present(Alert.create({title: "Login failed", subTitle: "The credentials you entered are invalid.", buttons: ['Dismiss']}));
      }
    });
  }
}
