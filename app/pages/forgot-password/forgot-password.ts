import {Component} from '@angular/core';
import {NavController, Alert, Loading} from 'ionic-angular';
import {Toast} from "ionic-native/dist/index";

/*
 Generated class for the ForgotPasswordPage page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  templateUrl: 'build/pages/forgot-password/forgot-password.html',
})
export class ForgotPasswordPage {

  data;

  constructor(private nav:NavController) {
    this.data = {email: ''};
  }

  private loading;
  private showLoading = () => {
    this.loading = Loading.create({dismissOnPageChange: true});
    this.nav.present(this.loading);
  };

  private hideLoading = () => {
    if (this.loading) {
      setTimeout(() => {
        this.loading.dismiss();
      }, 500);
    }
  };

  sendResetInstructions = () => {
    var vm = this;
    var emailAddress = vm.data.email;

    if (typeof(emailAddress) === 'undefined' || emailAddress.length < 1) {
      Toast.showShortBottom("The email you entered is invalid.");
      return;
    }

    vm.showLoading();
    firebase.auth().sendPasswordResetEmail(emailAddress).then(function () {
      vm.hideLoading();
      vm.nav.present(Alert.create({title: 'Email sent', subTitle: 'Check your email address for the password reset email and follow the instructions from there.', buttons: ['Dismiss']}));
      vm.data.email = '';
    }, function (error) {
      vm.hideLoading();
      var errorCode = error['code'];
      if (errorCode === "auth/invalid-email" || errorCode === "auth/user-not-found") {
        Toast.showShortBottom("The email you entered is not tied to a user.");
      } else if (errorCode === "auth/network-request-failed") {
        Toast.showShortBottom("Unable to connect to the server. Check your internet connection and try again.");
      } else {
        Toast.showShortBottom("Password reset failed. Check your internet connection and try again.");
      }
    });
  };

}
