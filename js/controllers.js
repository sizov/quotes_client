'use strict';

function isNullOrUndefined(a) {
	var rc = false;
	if (a === null || typeof (a) === "undefined") {
		rc = true;
	}
	return rc;
}

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
		if (isNullOrUndefined(allCorrectAnswers) || allCorrectAnswers.length === 0) {
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

function SettingsController($scope, $routeParams, $location, ResetUserStatsService, SettingsService) {		
//TODO: Think how to reuse functionality here and in intro
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

function IntroController($scope, $routeParams, $location, ResetUserStatsService, SettingsService, UserStatusService) {
	//we are gettomg user current status
	/*	("USER_STATUS_NO_QUESTIONS_ASKED", 0);
		("USER_STATUS_DIDNT_ANSWER_LAST_QUESTION", 1);
		("USER_STATUS_ANSWERED_ALL_QUESTIONS", 2);
		("USER_STATUS_ANSWERED_LAST_QUESTION_NEEDS_MORE", 3);*/
	UserStatusService.get(
		{},
		function (answer){
			$scope.userStatus = answer.userStatus;
			switch (answer.userStatus){
				case 0:
					break;
				case 1:
					break;
				case 2:
					break;
				case 3:
					break;
				default:
			}
		}
	)
	
	$scope.continueAnswering = function () {
		$location.path("/game");
	}
	
	$scope.showResults = function () {
		$location.path("/result/");
	}

	$scope.reset = function () {
		ResetUserStatsService.get(
			{},
			function (){
				$location.path("/game");
			}
		)
	}
	
	$scope.start = function () {
		$location.path("/game");
	}

/*-----------------------------------------------------------*/	
//TODO: This is repeated code that is used in intro controller
/*-----------------------------------------------------------*/
	
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

//IntroController.$inject = ['$scope', '$routeParams', '$location', 'ResetUserStatsService', 'SettingsService', 'UserStatusService'];
