import {Component} from "@angular/core";
import {NavController, AlertController, LoadingController, ToastController} from "ionic-angular";
import {AuthProvider} from "../../providers/firebase/auth.provider";

@Component({
  templateUrl: 'build/pages/forgot-password/forgot-password.html',
  providers: [AuthProvider]
})
export class ForgotPasswordPage {

  data;

  constructor(private nav: NavController,
              private toastController: ToastController,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private authProvider: AuthProvider) {
    this.data = {email: ''};
  }

  private loading;
  private showLoading = () => {
    this.loading = this.loadingController.create({dismissOnPageChange: true});
    this.loading.present();
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
      vm.toastController.create({message: 'The email you entered is invalid.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
      return;
    }

    vm.showLoading();
    vm.authProvider.sendPasswordResetEmail(emailAddress).then(function () {
      vm.hideLoading();
      vm.alertController.create({title: 'Email sent', subTitle: 'Check your email address for the password reset email and follow the instructions from there.', buttons: ['Dismiss']}).present();
      vm.data.email = '';
    }).catch(error => {
      vm.hideLoading();
      var errorCode = error['code'];
      if (errorCode === 'auth/invalid-email' || errorCode === 'auth/user-not-found') {
        vm.toastController.create({message: 'The email you entered is not tied to a user.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
      } else if (errorCode === 'auth/network-request-failed') {
        vm.toastController.create({message: 'Unable to connect to the server. Check your internet connection and try again.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
      } else {
        vm.toastController.create({message: 'Password reset failed. Check your internet connection and try again.', duration: 3000, position: 'bottom', dismissOnPageChange : true}).present();
      }
    });
  };

}
