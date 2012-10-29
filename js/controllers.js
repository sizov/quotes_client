'use strict';

function isNullOrUndefined(a) {
	var rc = false;
	if (a === null || typeof (a) === "undefined") {
		rc = true;
	}
	return rc;
}

/* Controllers */

function QuoteAndOriginsController($scope, $routeParams, $location, QuoteAndOriginsService, VerifyAnswerService, SettingsService) {
	$scope.testLabel = function(quotesAsked, quotesInSet) {
			if(quotesAsked == quotesInSet) {
				return "Result"
			}
			else {
				return "Next";
			}
		};
		
	$scope.getRandomQuote = function () {
		$scope.answerVerificationReceived = false;
		$scope.isCommunicatingWithServer = true;
		$scope.allCorrectAnswers = null;
		QuoteAndOriginsService.getRandomQuote(
			{},
			function (response) {
				$scope.isCommunicatingWithServer = false;
			
				if (response.hasOwnProperty('result')) {
					$location.path("/result/");
					return;
				}
				
				if (response.hasOwnProperty('error')) {
					$location.path("/error/" + response.error);
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
	
	$scope.getRandomQuote();
}

//QuoteAndOriginsController.$inject = ['$scope', '$routeParams', '$location' , 'QuoteAndOriginsService', 'VerifyAnswerService', 'SettingsService'];

function ErrorController($scope, $routeParams, $location, ResetUserStatsService) {
	var errorCode = $routeParams.errorCode;
	switch (errorCode) {
	case "0":
		$scope.errorText = "Error in database processing";
		break;
	case "1":
		$scope.errorText = "Unable to find correct answer for this question in database";
		break;
	case "2":
		$scope.errorText = "No more questions in DB";
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

function ResultController($scope, $routeParams, $location, ResetUserStatsService, UserResultService) {
	$scope.reset = function () {
		ResetUserStatsService.get(
			{},
			function (){
				$location.path("/");
			}
		)
	}
	
	$scope.getUserResult = function () {
		UserResultService.get(
			{},
			function (response) {
				if(!response || !response.resultData){
					return;
				}		
				
				$scope.amountQuestionsAsked = response.resultData.amountQuestionsAsked;
				$scope.amountCorrectAnsweres = response.resultData.amountCorrectAnsweres;
				
				$scope.resultRatio = 100 * $scope.amountCorrectAnsweres / $scope.amountQuestionsAsked;
			}
		);
	};

	$scope.getUserResult();
}

//ResultController.$inject = ['$scope', '$routeParams', '$location', 'ResetUserStatsService', 'UserResultService'];

function SettingsController($scope, $routeParams, $location, ResetUserStatsService, SettingsService) {		
	$scope.$watch(
		'questionsType',
		function(newValue, oldValue) {
			if (newValue === oldValue) return;
			SettingsService.setSelectedQuestionsType(newValue);
		}
	);
	
	$scope.$watch(
		'questionsLanguage',
		function(newValue, oldValue) {
			if (newValue === oldValue) return;
			SettingsService.setSelectedQuestionsLanguage(newValue);
		}
	);

	$scope.allQuestionsLanguage = SettingsService.getAllQuestionsLanguage();
	$scope.allQuestionsType = SettingsService.getAllQuestionsType();

	$scope.questionsType = SettingsService.getSelectedQuestionsType();
	$scope.questionsLanguage = SettingsService.getSelectedQuestionsLanguage();	
}

//SettingsController.$inject = ['$scope', '$routeParams', '$location', 'ResetUserStatsService', 'SettingsService'];