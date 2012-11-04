'use strict';

/* Services */

angular.module('quotesClientServices', ['ngResource']).
    factory('QuestionsAndAnswersService', function($resource){
		return $resource('api/getRandomQuote', {}, {});
	}).
    factory('VerifyAnswerService', function($resource){
		return $resource('api/verifyAnswer', {}, {});
	}).
	factory('ResetUserStatsService', function($resource){
		return $resource('api/resetUserStats', {}, {});
	}).
	factory('UserStatusService', function($resource){
		return $resource('api/getUserStatus', {}, {});
	}).
	factory('UserResultService', function($resource){
		return $resource('api/userResult', {}, {});
	}).
	factory('SettingsService', function($resource){
		var settings = {};
		
		var englishQuestionsLanguage = {key: 0, value: "English"};
		var russianQuestionsLanguage = {key: 1, value: "Russian"};
		
		var moviesQuestionsType = {key: 0, value: "Movies"};
		var famousPeopleQuestionsType = {key: 1, value: "Famous People"};
		
		settings.allQuestionsLanguage = [englishQuestionsLanguage, russianQuestionsLanguage];
		settings.allQuestionsType = [moviesQuestionsType, famousPeopleQuestionsType];
		
		settings.selectedQuestionsLanguage = englishQuestionsLanguage;
		settings.selectedQuestionsType = moviesQuestionsType;
	
		var settingsService = {};
		
		settingsService.getAllQuestionsLanguage = function () {
			return settings.allQuestionsLanguage;
		}
		
		settingsService.getAllQuestionsType = function () {
			return settings.allQuestionsType;
		}
		
		/*================================*/
		/*SelectedQuestionsType*/
		/*================================*/
		
		settingsService.getSelectedQuestionsType = function () {
			return settings.selectedQuestionsType;
		}
		
		settingsService.setSelectedQuestionsType = function (value) {
			settings.selectedQuestionsType = value;
		}
		
		/*================================*/
		/*SelectedQuestionsLanguage*/
		/*================================*/
		
		settingsService.getSelectedQuestionsLanguage = function () {
			return settings.selectedQuestionsLanguage;
		}
		
		settingsService.setSelectedQuestionsLanguage = function (value) {
			settings.selectedQuestionsLanguage = value;
		}
		
		return settingsService;
	});
