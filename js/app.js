'use strict';

/* App Module */

angular.module('quotesClient', ['quotesClientServices']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/quoteAndOrigins', {templateUrl: 'templates/quote-and-origins.html',   controller: QuoteAndOriginsController}).
			otherwise({redirectTo: '/quoteAndOrigins'});
	}]);
