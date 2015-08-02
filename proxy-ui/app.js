/*
 * Define App1
 * Uses ui-router
 */
angular.module('App', [
  'ui.router'
])

  .config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

      $urlRouterProvider.otherwise('/home');
      //App1 includes a state that runs and matches a App2s state
      //App2 path can be tracked via a regex state
      $stateProvider
        .state('home', {
          url: '/home',
          views: {
            'home': {
              templateUrl: 'home.html',
              controller: 'AppController'
            }
          }
        })
        .state('page2', {
          url: '/page2',
          views: {
            'page2': {
              templateUrl: 'page2.html',
              controller: 'Page2Controller'
            }
          }
        })
        .state('page2.tab1', {
          url: '/tab1',
          views: {
            'tab1': {
              templateUrl: 'tab1.html',
              controller: 'Tab1Controller'
            }
          }
        }).state('page2.tab2', {
          url: '/tab2',
          views: {
            'tab2': {
              templateUrl: 'tab1.html',
              controller: 'Tab1Controller'
            }
          }
        });
    }
  ])

  .run(['$rootScope',
    function($rootScope) {
      $rootScope.$on('$stateNotFound',
        function(event, unfoundState, fromState, fromParams) {
          console.log(event, unfoundState, fromState, fromParams);
        });
      $rootScope.$on('$stateChangeError',
        function(event, toState, toParams, fromState, fromParams, error) {
          console.log(event, toState, toParams, fromState, fromParams, error);
        });
      $rootScope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
          console.log('toState', toState);
        });
    }
  ])

  .controller('AppController', ['$scope', '$state', '$stateParams',
    function($scope, $state, $stateParams) {
      $scope.PageName = 'App';
      $scope.stateJSON = JSON.stringify($state.current, null, 2);
      $scope.stateParamsJSON = JSON.stringify($stateParams, null, 2);
    }
  ])

  .controller('Page2Controller', ['$scope', '$state', '$stateParams',
    function($scope, $state, $stateParams) {
      $scope.PageName = 'Page2';
      $scope.stateJSON = JSON.stringify($state.current, null, 2);
      $scope.stateParamsJSON = JSON.stringify($stateParams, null, 2);
    }
  ])

  .controller('Tab1Controller', ['$scope', '$state', '$stateParams',
    function($scope, $state, $stateParams) {
      $scope.PageName = 'tab1';
      $scope.stateJSON = JSON.stringify($state.current, null, 2);
      $scope.stateParamsJSON = JSON.stringify($stateParams, null, 2);
    }
  ])

  .controller('Tab2Controller', ['$scope', '$state', '$stateParams',
    function($scope, $state, $stateParams) {
      $scope.PageName = 'tab2';
      $scope.stateJSON = JSON.stringify($state.current, null, 2);
      $scope.stateParamsJSON = JSON.stringify($stateParams, null, 2);
    }
  ]);