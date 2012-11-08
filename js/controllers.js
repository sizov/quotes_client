'use strict';

/* Controllers */

function QuoteAndOriginsController($scope, $routeParams, $location, QuestionsAndAnswersService, VerifyAnswerService, SettingsService) {
	$scope.getNextButtonLabel = function(amountQuestionsAsked, amountQuestionsInSet) {
			if(amountQuestionsAsked == amountQuestionsInSet) {
				return "Result"
			}
			else {
				return "Next";
			}
		};
		
	$scope.getRandomQuestion = function () {
		$scope.answerVerificationReceived = false;
		$scope.isCommunicatingWithServer = true;
		$scope.allCorrectAnswers = null;
		
		QuestionsAndAnswersService.get(
			{
				type_id:SettingsService.getSelectedQuestionsType().key,
				language_id:SettingsService.getSelectedQuestionsLanguage().key
			},
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
			
				$scope.question = response.question;
				$scope.answers = response.answers;
				$scope.amountQuestionsAsked = response.amountQuestionsAsked;
				$scope.amountQuestionsInSet = response.amountQuestionsInSet;
			}
		);
	};

	$scope.answerClickHandler = function (question, answer) {
		$scope.isCommunicatingWithServer = true;
		VerifyAnswerService.get(
			{question_text: question, answer_text: answer},
			function (answer) {
				$scope.answerVerificationReceived = true;
				$scope.allCorrectAnswers = answer.allCorrectAnswers;
			}
		);
	};

	$scope.nextClickHandler = function () {
		$scope.getRandomQuestion();
	};

	$scope.getAnswerButtonClass = function (origin, allCorrectAnswers) {
		if (allCorrectAnswers === null || typeof (allCorrectAnswers) === "undefined" || allCorrectAnswers.length === 0) {
			return 'btn btn-large btn-block';
		}

		if (allCorrectAnswers.indexOf(origin) !== -1) {
			return 'btn btn-large btn-block btn-success';
		}

		return 'btn btn-large btn-block';
	};
	
	$scope.getRandomQuestion();
}

//QuoteAndOriginsController.$inject = ['$scope', '$routeParams', '$location' , 'QuestionsAndAnswersService', 'VerifyAnswerService', 'SettingsService'];

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

function IntroController($scope, $routeParams, $location, ResetUserStatsService, SettingsService, UserStatusService) {
	/*we are gettomg user current status*/
	$scope.getCurrentStatus = function (){
		UserStatusService.get(
			{},
			function (answer){
				$scope.userStatus = answer.userStatus;
				switch (answer.userStatus){
					case 0:
						$scope.infoText = "Please choose settings for game and press start";
						break;
					case 1:
						$scope.infoText = "You have not finished previous game. You may now continue playing or start new one";
						break;
					case 2:
						$scope.infoText = "You have answered all questions in set. You may now see your results or start new game";
						break;
					case 3:
						$scope.infoText = "You have not finished your previous game. You may now continue playing or start new one";
						break;
					default:
				}
			}
		)
	}
	
	$scope.continueAnswering = function () {
		$location.path("game");
	}
	
	$scope.showResults = function () {
		$location.path("result");
	}

	$scope.reset = function () {
		ResetUserStatsService.get(
			{},
			function (){
				$scope.getCurrentStatus();
			}
		)
	}
	
	$scope.start = function () {
		$location.path("game");
	}

	$scope.$watch(
		'selectedQuestionsType',
		function(newValue, oldValue) {
			if (newValue === oldValue) return;
			SettingsService.setSelectedQuestionsType(newValue);
		}
	);
	
	$scope.$watch(
		'selectedQuestionsLanguage',
		function(newValue, oldValue) {
			if (newValue === oldValue) return;
			SettingsService.setSelectedQuestionsLanguage(newValue);
		}
	);	
	
	/*gets reference to object from array for which all properties are same as targetObejct*/
	function getSameObjectFromArray(targetObject, array) {
		for (var i=0; i < array.length; i++) {
			var objectFromArray = array[i];
			
			//TODO: this is BAD solution for comparing objects. Cretae your utility base on StackOverFlow answers
			//+read article about best practices to create UTILS: http://frugalcoder.us/post/2010/02/11/js-classes.aspx
			//OR use underscore
			if(JSON.stringify(objectFromArray) === JSON.stringify(targetObject)){
				return objectFromArray;
			}
		}
		return null;
	}

	$scope.allQuestionsLanguage = SettingsService.getAllQuestionsLanguage();
	//we are retrieving potentially from localstorage and onject might have same contant as in collection,
	//but it should be actually same object reference for dropdown selection to auto-bind
	var tempSelectedQuestionsLanguage = SettingsService.getSelectedQuestionsLanguage();
	$scope.selectedQuestionsLanguage = getSameObjectFromArray(tempSelectedQuestionsLanguage, $scope.allQuestionsLanguage);

	$scope.allQuestionsType = SettingsService.getAllQuestionsType();
	$scope.selectedQuestionsType = getSameObjectFromArray(SettingsService.getSelectedQuestionsType(), $scope.allQuestionsType);
	
	$scope.getCurrentStatus();
}

//IntroController.$inject = ['$scope', '$routeParams', '$location', 'ResetUserStatsService', 'SettingsService', 'UserStatusService'];
