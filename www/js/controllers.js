angular.module('app.controllers', [])

  .controller('splashCtrl', function ($scope, $state) {
    // Disable animation on transition
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });

    // Check authentication state and move to the appropriate page
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        $state.go('tabscontroller');
      } else {
        $state.go('login');
      }
    });
  })

  .controller('loginCtrl', function ($scope, ionicToast) {
    $scope.data = {};

    $scope.login = function () {
      // TODO: Validation

      var email = $scope.data.email;
      var password = $scope.data.password;

      firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
        // TODO: Fix ionicToast not working
        ionicToast.show('Login successful. Welcome back!', 'bottom', false, 2000);
        $state.transitionTo('tabscontroller');

      }).catch(function (error) {
        ionicToast.show('The credentials entered are invalid.', 'bottom', false);
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
      });
    }
  })

  .controller('signupCtrl', function ($scope) {

  })

  .controller('forgotPasswordCtrl', function ($scope) {

  })

  .controller('nearMeCtrl', function ($scope) {

  })

  .controller('conversationsCtrl', function ($scope) {

  })

  .controller('friendsCtrl', function ($scope) {

  })

  .controller('pokedexCtrl', function ($scope) {

  })

  .controller('profileCtrl', function ($scope) {

  })

  .controller('conversationCtrl', function ($scope) {

  });
