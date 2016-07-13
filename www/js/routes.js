angular.module('app.routes', [])

  .config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('splash', {
        url: '/splash',
        templateUrl: 'templates/splash.html',
        controller: 'splashCtrl'
      })

      .state('login', {
        url: '/signin',
        templateUrl: 'templates/auth/login.html',
        controller: 'loginCtrl'
      })

      .state('signup', {
        url: '/signup',
        templateUrl: 'templates/auth/signup.html',
        controller: 'signupCtrl'
      })

      .state('forgotPassword', {
        url: '/forgot-password',
        templateUrl: 'templates/auth/forgotPassword.html',
        controller: 'forgotPasswordCtrl'
      })

      .state('setup', {
        url: '/setup',
        templateUrl: 'templates/auth/setup.html',
        controller: 'setupCtrl'
      })

      .state('tabsController', {
        url: '/tabscontroller',
        templateUrl: 'templates/mainTabs/tabsController.html',
        abstract: true
      })

      .state('tabsController.nearMe', {
        url: '/near-me',
        views: {
          'tabNearMe': {
            templateUrl: 'templates/mainTabs/nearMe.html',
            controller: 'nearMeCtrl'
          }
        }
      })

      .state('tabsController.conversations', {
        url: '/conversations',
        views: {
          'tabMessages': {
            templateUrl: 'templates/mainTabs/conversations.html',
            controller: 'conversationsCtrl'
          }
        }
      })

      .state('tabsController.friends', {
        url: '/friends',
        views: {
          'tabFriends': {
            templateUrl: 'templates/mainTabs/friends.html',
            controller: 'friendsCtrl'
          }
        }
      })

      .state('tabsController.pokedex', {
        url: '/pokedex',
        views: {
          'tabPokedex': {
            templateUrl: 'templates/mainTabs/pokedex.html',
            controller: 'pokedexCtrl'
          }
        }
      })

      .state('tabsController.profile', {
        url: '/profile',
        views: {
          'tabProfile': {
            templateUrl: 'templates/mainTabs/profile.html',
            controller: 'profileCtrl'
          }
        }
      })

      .state('conversation', {
        url: '/conversation',
        templateUrl: 'templates/conversation.html',
        controller: 'conversationCtrl'
      });

    $urlRouterProvider.otherwise('/splash')

  });
