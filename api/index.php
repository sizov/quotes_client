<?php
require 'Slim/Slim.php';

/* CONSTANTS */
define("AMOUNT_QUOTES_IN_SET","6");
define("AMOUNT_ORIGINS_TO_CHOOSE","4");
	
$app = new Slim();

$app->get('/getRandomQuote', 'getRandomQuote');

$app->run();

/*================================================*/
/*Quotes*/
/*================================================*/

function getRandomQuote() {
	$request = Slim::getInstance()->request();
	$origin_type_id = $request->get('origin_type_id');
	
	//session already started????
	//session_start(); 	
	
//TODO: remove this as ir workaround to make PHP framework work
	$_SESSION['asked_quotes_IDs']= NULL;
	
	/*--------------------------------------------------------------------*/
	/* select quote as question */
	/*--------------------------------------------------------------------*/
	
	/* if user was NOT already asked any questions or restart was launched*/
	if (!isset($_SESSION['asked_quotes_IDs']) || isset($_GET['restart']) && $_GET["restart"] === "1"){		
	
		$_SESSION['asked_quotes_IDs'] = array();
		
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
	}	
	try {
		$db = getConnection();
		$stmt = $db->prepare($sql);  
		$stmt->bindParam("origin_type_id", $origin_type_id);
		$stmt->execute();
		$quoteQuestion = $stmt->fetchObject();		
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}'; 
	}
	
	/*---------------------------------------------------*/
	/* select origins by provided type as answer options */
	/*---------------------------------------------------*/
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
		//leaving only origin_text in elements, not objects
		for($i = 0; $i < count($originsToChooseFrom); $i++){
			//$origins_to_choose_from[$i] = $originsToChooseFrom[$i]->origin_text;
			$originsToChooseFrom[$i] = $originsToChooseFrom[$i]->origin_text;
		}
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}'; 
	}			
	
	/*--------------------------------*/
	/* select correct answer (origin) */
	/*--------------------------------*/
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
		echo '{"error":{"text":'. $e->getMessage() .'}}'; 
	}						
		
	//replace one of answers with correct answer
	if(!in_array($correctOriginText, $originsToChooseFrom)) {
		$originsToChooseFrom[0] = $correctOriginText;
	}
	shuffle($originsToChooseFrom);
	
	/* prepare result */	
	$quoteQuestion = $quoteQuestion->quote_text;
	$json_data = array ('quote'=>$quoteQuestion,
						'origins'=>$originsToChooseFrom/*,
						'quotesAsked'=>count($asked_quotes_IDs),
						'quotesInSet'=>$AMOUNT_QUOTES_IN_SET
						*/);
		
	/* output to JSON */
	$db = null;
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