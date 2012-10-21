<?php
require 'Slim/Slim.php';

/* CONSTANTS */
define("AMOUNT_QUOTES_IN_SET","4");
define("AMOUNT_ORIGINS_TO_CHOOSE","4");
define("SEND_CORRECT_ANSWER",true);

define("INFO_CODE_SET_ENDED", 0);
define("INFO_CODE_NO_MORE_UNIQUE_QUOTES", 1);
define("ERROR_CODE_SQL_PROCESSING", 0);
define("ERROR_CODE_NO_CORRECT_ANSWER_IN_DB", 1);

session_cache_limiter(false);
session_start();
	
$app = new Slim();

/*
$app->add(new Slim_Middleware_SessionCookie(array(
    'expires' => '20 minutes',
    'path' => '/',
    'domain' => null,
    'secure' => false,
    'httponly' => false,
    'name' => 'slim_session',
    'secret' => 'CHANGE_ME',
    'cipher' => MCRYPT_RIJNDAEL_256,
    'cipher_mode' => MCRYPT_MODE_CBC
)));
*/

$app->get('/getRandomQuote', 'getRandomQuote');
$app->get('/verifyAnswer', 'verifyAnswer');
$app->get('/resetUserStats', 'resetUserStats');

$app->run();

/*================================================*/
/*get andom quote*/
/*================================================*/

function getRandomQuote() {
	$request = Slim::getInstance()->request();
	$origin_type_id = $request->get('origin_type_id');
	
	/*if user requested reset*/
	if(isset($_GET['restart']) && $_GET["restart"] === "1"){
		resetUserStats();
	}	
	
	/*-------------------------------------------------------------------------*/
	/* if user was NOT already asked any questions*/
	/*-------------------------------------------------------------------------*/	
	if (!isset($_SESSION['asked_quotes_IDs']) || count($_SESSION['asked_quotes_IDs']) == 0){		

		/*setting to empty array as this session var used futher down in the code*/
		$_SESSION['asked_quotes_IDs']= array();
		
		$sql = "	
				SELECT *
				FROM quotes
				WHERE origin_id	IN (
									SELECT id
									FROM quote_origins
									WHERE type_id=:origin_type_id
									)
				ORDER BY rand()
				LIMIT 1
				";										

		/*Retrieve question form DB*/
		try {
			$db = getConnection();
			$stmt = $db->prepare($sql);  
			$stmt->bindParam("origin_type_id", $origin_type_id);
			$stmt->execute();
			$quoteQuestion = $stmt->fetchObject();		
		} catch(PDOException $e) {
			sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
			exit();
		}
	}		
	
	/*------------------------------------------------------------------------------------*/
	/* If user did not answer any questions, but we sent him them OR */
	/* if he did not answer last asked question, let's ask last question again */
	/*------------------------------------------------------------------------------------*/	
	else if(isset($_SESSION['last_asked_quote_text']) &&
			isset($_SESSION['last_asked_origins_to_choose_from']) &&
			isset($_SESSION['asked_quotes_IDs']) &&
			(!isset($_SESSION['last_answered_quote_text']) ||
			$_SESSION['last_answered_quote_text'] <> $_SESSION['last_asked_quote_text']	)){					
		
		sendQuestionAndAnswers(	$_SESSION['last_asked_quote_text'],
								$_SESSION['last_asked_origins_to_choose_from'],
								$_SESSION['asked_quotes_IDs'],
								AMOUNT_QUOTES_IN_SET);
								
								
		exit();
	}
	
	/*------------------------------------------------------------------------------------*/
	/* Finally if we got here, only option that remains - */
	/* user has already answered some questions and it's time to retrieve new one or finish
	/* set of questions */
	/*------------------------------------------------------------------------------------*/	
	else{
	
		$askedQuotesIDs = $_SESSION['asked_quotes_IDs'];

		/* if set of quotes questions has ended - exit with info message */
		if(count($askedQuotesIDs) == AMOUNT_QUOTES_IN_SET){					
			sendInfo(INFO_CODE_SET_ENDED);			
			exit();
		}
		
		$askedQuotesIDsString = "(".implode(',', $askedQuotesIDs).")";
				
		$sql = "
				SELECT *
				FROM quotes
				WHERE id NOT IN ".$askedQuotesIDsString."
				AND	origin_id IN (
									SELECT id
									FROM quote_origins
									WHERE type_id=:origin_type_id
								)
				ORDER BY rand()
				LIMIT 1
				";				
				
		/*Retrieve question form DB*/
		try {
			$db = getConnection();
			$stmt = $db->prepare($sql);  
			$stmt->bindParam("origin_type_id", $origin_type_id);
			$stmt->execute();
			$quoteQuestion = $stmt->fetchObject();		
		} catch(PDOException $e) {
			sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
			exit();
		}
	}	
		
	
	/* select origins by provided type as answer options */
	$sql = "
			SELECT origin_text
			FROM quote_origins
			WHERE type_id=:origin_type_id
			ORDER BY rand()
			LIMIT ".AMOUNT_ORIGINS_TO_CHOOSE."
			";							
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);  
		$stmt->bindParam("origin_type_id", $origin_type_id);
		$stmt->execute();
		$originsToChooseFrom = $stmt->fetchAll(PDO::FETCH_OBJ);
		/*leaving only origin_text in elements, not objects*/
		for($i = 0; $i < count($originsToChooseFrom); $i++){
			$originsToChooseFrom[$i] = $originsToChooseFrom[$i]->origin_text;
		}
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}			
	
	/* select correct answer (origin) */
	$sql = "
			SELECT origin_text
			FROM quote_origins
			WHERE id=:questionQuoteOriginId;
			";	
	try {
		$questionQuoteOriginId = $quoteQuestion->origin_id;
		$db = getConnection();
		$stmt = $db->prepare($sql);  		
		$stmt->bindParam("questionQuoteOriginId", $questionQuoteOriginId);
		$stmt->execute();
		$correctOriginText = $stmt->fetchObject();		
		$correctOriginText = $correctOriginText->origin_text;
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}						
		
	/*replace one of answers with correct answer*/
	if(!in_array($correctOriginText, $originsToChooseFrom)) {
		$originsToChooseFrom[0] = $correctOriginText;
	}
	shuffle($originsToChooseFrom);
	
	$askedQuoteIDs = $_SESSION['asked_quotes_IDs'];
	$askedQuoteIDs[] = $quoteQuestion->id;	
		
	/* send data */	
	sendQuestionAndAnswers(	$quoteQuestion->quote_text,
							$originsToChooseFrom,
							$askedQuoteIDs,
							AMOUNT_QUOTES_IN_SET);
} 

function sendQuestionAndAnswers($quoteText,
								$originsToChooseFrom,
								$askedQuotesIDs,
								$amountQuotesInSet){
								
	$db = null;
								
	/*storing history of user answers in session*/
	$_SESSION['last_asked_quote_text'] = $quoteText;		
	$_SESSION['last_asked_origins_to_choose_from'] = $originsToChooseFrom;		
	$_SESSION['asked_quotes_IDs'] = $askedQuotesIDs;
	
	$json_data = array ('quote'=>$quoteText,
						'origins'=>$originsToChooseFrom,
						'quotesAsked'=>count($askedQuotesIDs),
						'quotesInSet'=>$amountQuotesInSet);						
	
	echo json_encode($json_data);	
}


/*================================================*/
/*Verify answer*/
/*================================================*/

function verifyAnswer() {
	$request = Slim::getInstance()->request();
	
	/* get result type*/
	$quoteText = $request->get("quote_text"); 
	$answeredOriginText =  $request->get("origin_text");

	$_SESSION['last_answered_quote_text'] = $quoteText;
	
	/* select all possible origins that have provided quote*/	
	$sql = "
			SELECT `origin_text`	
			FROM `quote_origins`
			WHERE id IN (
							SELECT `origin_id`
							FROM `quotes`
							WHERE quote_text = :quote_text
						)
			";				
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);  		
		$stmt->bindParam("quote_text", $quoteText);
		$stmt->execute();
		$correctOrigins = $stmt->fetchAll(PDO::FETCH_OBJ);
		/*leaving only origin_text in elements, not objects*/
		for($i = 0; $i < count($correctOrigins); $i++){
			$correctOrigins[$i] = $correctOrigins[$i]->origin_text;
		}
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}
	
	/*if array of correct origins is empty -> there are no origins for providede quote*/
	if(count($correctOrigins) == 0){
		sendError(ERROR_CODE_NO_CORRECT_ANSWER_IN_DB);			
		exit();
	}
	else{
		$isUserAnswerCorrect = in_array($answeredOriginText, $correctOrigins);
		if(SEND_CORRECT_ANSWER){			
			echo json_encode(array('isUserAnswerCorrect'=>$isUserAnswerCorrect, 'allCorrectAnswers'=>$correctOrigins));
		}
		else{
			echo json_encode(array('isUserAnswerCorrect'=>$isUserAnswerCorrect));
		}
	}	
	
	$db = null;
}

function resetUserStats() {
	unset($_SESSION['last_asked_quote_text']);
	unset($_SESSION['last_answered_quote_text']);
	unset($_SESSION['last_asked_origins_to_choose_from']);
	unset($_SESSION['asked_quotes_IDs']);	
}

function sendInfo($infoCode){
	$db = null;	
	$json_data = array ('infoCode'=>$infoCode);
	echo json_encode($json_data);	
}

function sendError($errorCode, $errorMessage){
	$db = null;	
	$json_data = array ('errorCode'=>$errorCode, 'errorMessage'=>$errorMessage);
	echo json_encode($json_data);	
}


/*================================================*/
/*Other*/
/*================================================*/
function getConnection() {
	$dbhost="127.0.0.1";
	$dbuser="root";
	$dbpass="";
	$dbname="quotes";
	$dbh = new PDO("mysql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass);	
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	return $dbh;
}

?>