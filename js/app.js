'use strict';

/* App Module */

angular.module('quotesClient', ['quotesClientServices']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/quoteAndOrigins', {templateUrl: 'templates/quote-and-origins.html',   controller: QuoteAndOriginsController}).
			when('/error/:errorCode', {templateUrl: 'templates/error.html',   controller: ErrorController}).
			when('/info/:infoCode', {templateUrl: 'templates/info.html',   controller: InfoController}).
			otherwise({redirectTo: '/quoteAndOrigins'});
	}]);
