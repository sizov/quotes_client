'use strict';

/* App Module */

angular.module('quotesClient', ['quotesClientServices']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.			
			when('/', {templateUrl: 'templates/intro.html',   controller: IntroController}).
			when('/game', {templateUrl: 'templates/quote-and-origins.html',   controller: QuoteAndOriginsController}).
			when('/error/:errorCode', {templateUrl: 'templates/error.html',   controller: ErrorController}).
			when('/result/', {templateUrl: 'templates/result.html',   controller: ResultController}).
			otherwise({redirectTo: '/'});
	}]);
