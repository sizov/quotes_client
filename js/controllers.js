'use strict';

/* Controllers */

function QuoteAndOriginsController($scope, $routeParams, QuoteAndOriginsService, VerifyAnswerService) {
	$scope.getRandowQuoteResultHandler = function(quoteAndOriginsObject) {
		$scope.quote = quoteAndOriginsObject.quote;
		$scope.origins = quoteAndOriginsObject.origins;
	};
	
	$scope.getRandomQuote = function(){
		QuoteAndOriginsService.getRandomQuote(
			{},
			$scope.getRandowQuoteResultHandler
		);
	};

	$scope.originClickHandler=function(quote, origin){
		VerifyAnswerService.get(
			{quote_text:quote, origin_text: origin},
			function(answer){
				$scope.isUserAnswerCorrect = answer.isUserAnswerCorrect;
				if($scope.isUserAnswerCorrect){
					$scope.getRandomQuote();
				}
				else{					
					//alert("WRONG!!!");
				}
			}
		);
	};
	
	$scope.getClass = function(origin, correctOrigin){
		return 'correctOrigin'//'possibleOrigin'
	};
	
	$scope.getRandomQuote();
}

//PhoneDetailCtrl.$inject = ['$scope', '$routeParams', 'QuoteAndOriginsService', 'VerifyAnswerService'];
