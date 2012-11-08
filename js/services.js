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
		var settingsService = {}; //service itself
	
		var mockStorage; //used to store settings if local storage is not supported		
		var supportsLocalStorage = Modernizr.localstorage;
		
		//if localstorage does not exist or default values were not set - set them
		if (!localStorageHas('selectedQuestionsLanguage') ||
			!localStorageHas('allQuestionsLanguage') ||
			!localStorageHas('selectedQuestionsType') ||
			!localStorageHas('allQuestionsType')){
			
			setDefaultData();
		}

		/*getters for collections*/		
		settingsService.getAllQuestionsLanguage = function () {
			return loadFromStorage('allQuestionsLanguage');
		}
		
		settingsService.getAllQuestionsType = function () {
			return loadFromStorage('allQuestionsType');
		}
		
		/*get/set SelectedQuestionsType*/	
		settingsService.getSelectedQuestionsType = function () {
			return loadFromStorage('selectedQuestionsType');
		}
		
		settingsService.setSelectedQuestionsType = function (value) {
			saveToStorage('selectedQuestionsType', value);
		}
		
		/*get/set SelectedQuestionsLanguage*/		
		settingsService.getSelectedQuestionsLanguage = function () {
			return loadFromStorage('selectedQuestionsLanguage');
		}
		
		settingsService.setSelectedQuestionsLanguage = function (value) {
			saveToStorage('selectedQuestionsLanguage', value);
		}
		
		/*======================================================================*/
		/*PRIVATE: Function that creates default values for settings*/
		/*======================================================================*/
		function setDefaultData () {
			var englishQuestionsLanguage = {key: 0, value: "English"};
			var russianQuestionsLanguage = {key: 1, value: "Russian"};
			saveToStorage('selectedQuestionsLanguage', englishQuestionsLanguage);
			saveToStorage('allQuestionsLanguage', [englishQuestionsLanguage, russianQuestionsLanguage]);
			
			var moviesQuestionsType = {key: 0, value: "Movies"};
			var famousPeopleQuestionsType = {key: 1, value: "Famous People"};
			saveToStorage('selectedQuestionsType', moviesQuestionsType);
			saveToStorage('allQuestionsType', [moviesQuestionsType, famousPeopleQuestionsType]);
		}		
		
		/*======================================================================*/
		/*PRIVATE: Utils function to save/read form local storage or mock object*/
		/*======================================================================*/
		function saveToStorage(key, value) {
			if (supportsLocalStorage){
				localStorage.setItem(key, JSON.stringify(value));
				return value;
			}
			
			mockStorage[key] = value;
			return value;
		}
		
		function loadFromStorage(key) {
			var result;
			if (supportsLocalStorage){
				result = localStorage.getItem(key);
				return JSON.parse(result);
			}
			
			return mockStorage[key];
		}
		
		function localStorageHas(key) {
			if (!supportsLocalStorage) return false;
			if (localStorage.getItem(key) === null) return false;
			return true;
		}

		return settingsService;
	});
