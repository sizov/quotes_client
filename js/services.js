'use strict';

/* Services */

angular.module('quotesClientServices', ['ngResource']).
    factory('QuoteAndOriginsService', function($resource){
		return $resource('api/getRandomQuote', {}, {
			getRandomQuote: {method:'GET', params:{origin_type_id:'1', language_id:'1'}}
		});
	}).
    factory('VerifyAnswerService', function($resource){
		return $resource('api/verifyAnswer', {}, {});
	}).
	factory('ResetUserStatsService', function($resource){
		return $resource('api/resetUserStats', {}, {});
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
