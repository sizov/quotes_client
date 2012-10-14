'use strict';

/* Services */

angular.module('quotesClientServices', ['ngResource']).
    factory('QuoteAndOriginsService', function($resource){
		return $resource('api/getRandomQuote', {}, {
			getRandomQuote: {method:'GET', params:{origin_type_id:'1'}}
		});
	});
