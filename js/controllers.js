'use strict';

/* Controllers */

function QuoteAndOriginsController($scope, $routeParams, QuoteAndOriginsService) {
	$scope.quote = 'quote sample';
	$scope.origins = ['origin sample 1','origin sample 2','origin sample 3'];
	
	QuoteAndOriginsService.getRandomQuote(
		{},
		function(quoteAndOriginsObject) {
			$scope.quote = quoteAndOriginsObject.quote;
			$scope.origins = quoteAndOriginsObject.origins;
		});


	/*
  $scope.quoteAndOrigins = QuoteAndOrigins.get({quoteAndOriginsId: $routeParams.quoteAndOriginsId}, function(quoteAndOrigins) {
    $scope.mainImageUrl = quoteAndOrigins.images[0];
  });

  $scope.setImage = function(imageUrl) {
    $scope.mainImageUrl = imageUrl;
  }
  */
}

//PhoneDetailCtrl.$inject = ['$scope', '$routeParams', 'QuoteAndOrigins'];
