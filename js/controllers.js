'use strict';

/* Controllers */

function QuoteAndOriginsController($scope, $routeParams, QuoteAndOriginsService) {
	QuoteAndOriginsService.getRandomQuote(
		{},
		function(quoteAndOriginsObject) {
			$scope.quote = quoteAndOriginsObject.quote;
			$scope.origins = quoteAndOriginsObject.origins;
		});
}

//PhoneDetailCtrl.$inject = ['$scope', '$routeParams', 'QuoteAndOrigins'];
