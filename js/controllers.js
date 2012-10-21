'use strict';

function isNullOrUndefined(a) {
	var rc = false;
	if (a === null || typeof (a) === "undefined") {
		rc = true;
	}
	return rc;
}

/* Controllers */

function QuoteAndOriginsController($scope, $routeParams, $location, QuoteAndOriginsService, VerifyAnswerService) {
	$scope.getRandomQuote = function () {
		$scope.answerVerificationReceived = false;
		$scope.allCorrectAnswers = null;
		QuoteAndOriginsService.getRandomQuote(
			{},
			function (response) {
				if (response.hasOwnProperty('infoCode')) {
					$scope.handleInfo(response['infoCode']);
					return;
				}
				
				if (response.hasOwnProperty('errorCode')) {
					$scope.handleError(response['errorCode']);
					return;
				}
			
				$scope.quote = response.quote;
				$scope.origins = response.origins;
				$scope.quotesAsked = response.quotesAsked;
				$scope.quotesInSet = response.quotesInSet;
			}
		);
	};

	$scope.originClickHandler = function (quote, origin) {
		VerifyAnswerService.get(
			{quote_text: quote, origin_text: origin},
			function (answer) {
				$scope.answerVerificationReceived = true;
				$scope.allCorrectAnswers = answer.allCorrectAnswers;
			}
		);
	};

	$scope.nextClickHandler = function () {
		$scope.getRandomQuote();
	};

	$scope.getOriginButtonClass = function (origin, allCorrectAnswers) {
		if (isNullOrUndefined(allCorrectAnswers) || allCorrectAnswers.length === 0) {
			return 'btn btn-large btn-block';
		}

		if (allCorrectAnswers.indexOf(origin) !== -1) {
			return 'btn btn-large btn-block btn-success';
		}

		return 'btn btn-large btn-block';
	};
	
	$scope.handleInfo = function (infoCode) {
		$location.path("/info/" + infoCode);
	}
	
	$scope.handleError = function (errorCode) {
		$location.path("/error/" + errorCode);
	}

	$scope.getRandomQuote();
}

//QuoteAndOriginsController.$inject = ['$scope', '$routeParams', '$location' , 'QuoteAndOriginsService', 'VerifyAnswerService'];

function ErrorController($scope, $routeParams, $location, ResetUserStatsService) {
	var errorCode = $routeParams.errorCode;
	switch (errorCode) {
	case "0":
		$scope.errorText = "Error in database processing";
		break;
	case "1":
		$scope.errorText = "Unable to find correct answer for this question in database";
		break;
	default:
		$scope.errorText = "Unknown error code";
		break;
	};
	
	$scope.reset = function () {
		ResetUserStatsService.get(
			{},
			function (){
				$location.path("/");
			}
		)
	}
}

//ErrorController.$inject = ['$scope', '$routeParams', '$location', 'ResetUserStatsService'];

function InfoController($scope, $routeParams, $location, ResetUserStatsService) {
	var infoCode = $routeParams.infoCode;
	switch (infoCode) {
	case "0":
		$scope.infoText = "You have answered all questions in set, you may now restart";
		break;
	case "1":
		$scope.infoText = "No more unique questions to ask";
		break;
	default:
		$scope.infoText = "Unknow info code";
		break;
	}
	
	$scope.reset = function () {
		ResetUserStatsService.get(
			{},
			function (){
				$location.path("/");
			}
		)
	}
}

//InfoController.$inject = ['$scope', '$routeParams', '$location', 'ResetUserStatsService'];