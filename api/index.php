<?php
require 'Slim/Slim.php';

/* CONSTANTS */
define("AMOUNT_OF_QUESTIONS_IN_SET","5");
define("AMOUNT_ANSWERS_TO_CHOOSE_FROM","3");
define("SEND_CORRECT_ANSWER",true);

define("INFO_CODE_SET_ENDED", 0);
define("ERROR_CODE_SQL_PROCESSING", 0);
define("ERROR_CODE_NO_CORRECT_ANSWER_IN_DB", 1);
define("ERROR_CODE_NO_MORE_UNIQUE_QUOTES", 2);

define("USER_STATUS_NO_QUESTIONS_ASKED", 0);
define("USER_STATUS_DIDNT_ANSWER_LAST_QUESTION", 1);
define("USER_STATUS_ANSWERED_ALL_QUESTIONS", 2);
define("USER_STATUS_ANSWERED_LAST_QUESTION_NEEDS_MORE", 3);

session_cache_limiter(false);
session_start();
	
$app = new Slim();

$app->get('/getUserStatus', 'getUserStatus');
$app->get('/getRandomQuote', 'getRandomQuote');
$app->get('/verifyAnswer', 'verifyAnswer');
$app->get('/resetUserStats', 'resetUserStats');
$app->get('/userResult', 'sendUserResult');

$app->run();

/*================================================*/
/*get andom quote*/
/*================================================*/
function getUserStatus() {
	$userStatus = calculateUserStatus();
	$json_data = array ('userStatus'=>$userStatus);						
	
	echo json_encode($json_data);	
}


/*================================================*/
/*get andom quote*/
/*================================================*/
function getRandomQuote() {
	$request = Slim::getInstance()->request();
	$typeId = $request->get('type_id');
	$languageId = $request->get('language_id');
	
	/*if user requested reset*/
	//not used, DELETE THIS ????????????
	/*
	if(isset($_GET['restart']) && $_GET["restart"] === "1"){
		resetUserStats();
	}	
	*/
	
	$userStatus = calculateUserStatus();
	
	switch($userStatus) {
	
		case USER_STATUS_NO_QUESTIONS_ASKED:
			/*setting to empty array as this session var used futher down in the code*/
			$_SESSION['askedQuestionsIDs']= array();
			$question = getQuestionWhenNoQuestionsAskedBefore($typeId, $languageId);
			break;
			
		case USER_STATUS_DIDNT_ANSWER_LAST_QUESTION:		
			/*send last questions again*/		
			sendQuestionAndAnswers(	$_SESSION['lastAskedQuestionText'],
									$_SESSION['lastSentAnswersToChooseFrom'],
									$_SESSION['askedQuestionsIDs'],
									AMOUNT_OF_QUESTIONS_IN_SET);													
			exit();			
			break;			
			
		case USER_STATUS_ANSWERED_ALL_QUESTIONS:
			sendUserResult();
			exit();	
			break;
			
		case USER_STATUS_ANSWERED_LAST_QUESTION_NEEDS_MORE:
			$question = getQuestionWhenAnsweredLastQuesrionNeedsMore($typeId, $languageId);
			break;
			
		 default:	
			$question = FALSE;
	}

	if($question == FALSE){
		sendError(ERROR_CODE_NO_MORE_UNIQUE_QUOTES);
		exit();
	}
	
			
	/* select answers by provided type as answer options */
	$sql = "
			SELECT origin_text
			FROM quote_origins
			WHERE type_id=:typeId
			AND language_id=:languageId
			ORDER BY rand()
			LIMIT ".AMOUNT_ANSWERS_TO_CHOOSE_FROM."
			";							
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);  
		$stmt->bindParam("typeId", $typeId);
		$stmt->bindParam("languageId", $languageId);
		$stmt->execute();
		$answersToChooseFrom = $stmt->fetchAll(PDO::FETCH_OBJ);
		/*leaving only origin_text in elements, not objects*/
		for($i = 0; $i < count($answersToChooseFrom); $i++){
			$answersToChooseFrom[$i] = $answersToChooseFrom[$i]->origin_text;
		}
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}			
	
	/* select correct answer */
	$sql = "
			SELECT origin_text
			FROM quote_origins
			WHERE id=:answerId;
			";	
	try {
		$answerId = $question->origin_id;
		$db = getConnection();
		$stmt = $db->prepare($sql);  		
		$stmt->bindParam("answerId", $answerId);
		$stmt->execute();
		$answerText = $stmt->fetchObject();		
		$answerText = $answerText->origin_text;
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}						
		
	/*replace one of answers with correct answer*/
	if(!in_array($answerText, $answersToChooseFrom)) {
		$answersToChooseFrom[0] = $answerText;
	}
	shuffle($answersToChooseFrom);
	
	$askedQuestionsIDs = $_SESSION['askedQuestionsIDs'];
	$askedQuestionsIDs[] = $question->id;	
		
	/* send data */	
	sendQuestionAndAnswers(	$question->quote_text,
							$answersToChooseFrom,
							$askedQuestionsIDs,
							AMOUNT_OF_QUESTIONS_IN_SET);
} 

function getQuestionWhenNoQuestionsAskedBefore($typeId, $languageId){
	$sql = "	
			SELECT *
			FROM quotes
			WHERE origin_id	IN (
								SELECT id
								FROM quote_origins
								WHERE type_id=:typeId
								AND language_id=:languageId
								)
			ORDER BY rand()
			LIMIT 1
			";										

	/*Retrieve question form DB*/
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);  
		$stmt->bindParam("typeId", $typeId);
		$stmt->bindParam("languageId", $languageId);
		$stmt->execute();
		$question = $stmt->fetchObject();		
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}
	
	return $question;
}

function getQuestionWhenAnsweredLastQuesrionNeedsMore($typeId, $languageId){
	$askedQuestionsIDs = $_SESSION['askedQuestionsIDs'];
	$askedQuestionsIDsString = "(".implode(',', $askedQuestionsIDs).")";
			
	$sql = "
			SELECT *
			FROM quotes
			WHERE id NOT IN ".$askedQuestionsIDsString."
			AND	origin_id IN (
								SELECT id
								FROM quote_origins
								WHERE type_id=:typeId
								AND language_id=:languageId
							)
			ORDER BY rand()
			LIMIT 1
			";				
			
	/*Retrieve question form DB*/
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);  
		$stmt->bindParam("typeId", $typeId);
		$stmt->bindParam("languageId", $languageId);
		$stmt->execute();
		$question = $stmt->fetchObject();		
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}
	return $question;
}



/*================================================*/
/*Verify answer*/
/*================================================*/
function verifyAnswer() {
	$request = Slim::getInstance()->request();
	
	/* get result type*/
	$questionText = $request->get("question_text"); 
	$answerText =  $request->get("answer_text");

	$_SESSION['lastAnsweredQuestionText'] = $questionText;
	
	/* select all possible origins that have provided quote*/	
	$sql = "
			SELECT `origin_text`	
			FROM `quote_origins`
			WHERE id IN (
							SELECT `origin_id`
							FROM `quotes`
							WHERE quote_text = :questionText
						)
			";				
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);  		
		$stmt->bindParam("questionText", $questionText);
		$stmt->execute();
		$correctAnswers = $stmt->fetchAll(PDO::FETCH_OBJ);
		/*leaving only origin_text in elements, not objects*/
		for($i = 0; $i < count($correctAnswers); $i++){
			$correctAnswers[$i] = $correctAnswers[$i]->origin_text;
		}
	} catch(PDOException $e) {
		sendError(ERROR_CODE_SQL_PROCESSING, $e->getMessage());			
		exit();
	}
	
	/*if array of correct origins is empty -> there are no origins for providede quote*/
	if(count($correctAnswers) == 0){
		sendError(ERROR_CODE_NO_CORRECT_ANSWER_IN_DB);			
		exit();
	}
	else{
		$isUserAnswerCorrect = in_array($answerText, $correctAnswers);
		if(!isset($_SESSION['amountCorrectAnsweres'])){
			$_SESSION['amountCorrectAnsweres'] = 0;
		}
		
		if($isUserAnswerCorrect){
			$_SESSION['amountCorrectAnsweres'] = $_SESSION['amountCorrectAnsweres'] + 1;
		}
		
		if(SEND_CORRECT_ANSWER){			
			echo json_encode(array('isUserAnswerCorrect'=>$isUserAnswerCorrect, 'allCorrectAnswers'=>$correctAnswers));
		}
		else{
			echo json_encode(array('isUserAnswerCorrect'=>$isUserAnswerCorrect));
		}
	}	
	
	$db = null;
}

/*================================================*/
/*Reset user status*/
/*================================================*/
function resetUserStats() {
	unset($_SESSION['lastAskedQuestionText']);
	unset($_SESSION['lastAnsweredQuestionText']);
	unset($_SESSION['lastSentAnswersToChooseFrom']);
	unset($_SESSION['askedQuestionsIDs']);	
	unset($_SESSION['amountCorrectAnsweres']);	
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

function sendQuestionAndAnswers($questionText,
								$answersToChooseFrom,
								$askedQuestionsIDs,
								$amountQuestionsInSet){
								
	$db = null;
								
	/*storing history of user answers in session*/
	$_SESSION['lastAskedQuestionText'] = $questionText;		
	$_SESSION['lastSentAnswersToChooseFrom'] = $answersToChooseFrom;		
	$_SESSION['askedQuestionsIDs'] = $askedQuestionsIDs;
	
	$json_data = array ('question'=>$questionText,
						'answers'=>$answersToChooseFrom,
						'amountQuestionsAsked'=>count($askedQuestionsIDs),
						'amountQuestionsInSet'=>$amountQuestionsInSet);						
	
	echo json_encode($json_data);	
}

function calculateUserStatus() {	
	/* if user was NOT already asked any questions*/
	if (!isset($_SESSION['askedQuestionsIDs']) || count($_SESSION['askedQuestionsIDs']) == 0){
		return USER_STATUS_NO_QUESTIONS_ASKED;
	}

	/* If user did not answer any questions, but we sent him them OR */
	/* if he did not answer last asked question, let's ask last question again */
	else if (isset($_SESSION['lastAskedQuestionText']) &&
			isset($_SESSION['lastSentAnswersToChooseFrom']) &&
			isset($_SESSION['askedQuestionsIDs']) &&
			(!isset($_SESSION['lastAnsweredQuestionText']) ||
			$_SESSION['lastAnsweredQuestionText'] <> $_SESSION['lastAskedQuestionText']	)){	
			
			return USER_STATUS_DIDNT_ANSWER_LAST_QUESTION;	
	}		
	
	/* If amount of questions asked equals amount of questions in set - user needs result */
	else if (count($_SESSION['askedQuestionsIDs']) >= AMOUNT_OF_QUESTIONS_IN_SET) {
		return USER_STATUS_ANSWERED_ALL_QUESTIONS;
	}

	/* Finally if we got here, only option that remains - user has already answered some questions*/
	/* and it's time to retrieve new one or finish set of questions */	
	else{	
		return USER_STATUS_ANSWERED_LAST_QUESTION_NEEDS_MORE;	
	}	
}

function sendUserResult(){
	sendResult(INFO_CODE_SET_ENDED, buildResult());			
}

function buildResult(){
	return array('amountQuestionsAsked'=>count($_SESSION['askedQuestionsIDs']),
				'amountCorrectAnsweres'=>$_SESSION['amountCorrectAnsweres']);
}

function sendResult($resultCode, $resultData){
	$db = null;	
	$json_data = array ('result'=>$resultCode, 'resultData'=>$resultData);
	echo json_encode($json_data);	
}

function sendError($errorCode, $errorData = null){
	$db = null;	
	$json_data = array ('error'=>$errorCode, 'errorData'=>$errorData);
	echo json_encode($json_data);	
}


?>