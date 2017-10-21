//main game object, new instance for each new game
function Game(){

	this.numCorrect=0;
 	this.numIncorrect=0;
 	this.numNoAnswer=0;
 	this.currentQuestionId = 0;
 	this.mode="start";
 	this.timerMax=15000;
 	this.timeRemaining=15;
 	this.questions=[];
 	this.correctAnswerId=null;
 	this.currentGuessId=null;
 	this.score=0;
}

$(document).ready(function(){


	var timer;

	var startGame = function(){
		//create copy of game object (initializes game)
		game = new Game();
		//API call to get questions.  Don't run next function until this is done
		$.get("https://opentdb.com/api.php?amount=10&type=multiple").done(function(response){
			game.questions = response.results;
		
		//probably cleaner methods to do this, this seemed as good as any to toggle the on screen divs
		$("#resultArea").addClass("hidden");
		$("#allResults").addClass("hidden");	
		$(".startDiv").addClass("hidden");
		$("#question").removeClass("hidden");
		$("#answerArea").removeClass('hidden');
		$("#countDown").removeClass('hidden');
		game.mode="receiveAnswers";
		//reveal questions on board
		showQuestionAndAnswers(game.currentQuestionId);
		})
	}


	var showQuestionAndAnswers = function(questionId){
		game.mode="receiveAnswers";
		//control timer via the "setting" in game object 
		game.timeRemaining= game.timerMax/1000;
		//randomize where the answer will go, API doesn't do this part
		game.correctAnswerId = Math.floor(Math.random()*4); 
		var incorrectIndex = 0;
		for(i=0;i<4;i++){
			if(i==game.correctAnswerId){
				$("#answer" + i).html(game.questions[questionId].correct_answer).removeClass("correct");
			}
			else {
			
				$("#answer" + i).html(game.questions[questionId].incorrect_answers[incorrectIndex]).removeClass("correct");
				incorrectIndex++;
			}
			
		}
		$("#question").html(game.questions[questionId].question);
		//countdown timer on questions
		timer = setInterval(countDown,1000);
	}
	//pass in whether the answer selected is correct (just a string)
	var showCorrectAnswer = function(result){
		var answerId = game.correctAnswerId;
		game.mode="showAnswer";
		clearInterval(timer);
		$("#answer" + (answerId)).addClass("correct");
		var questionsRemaining = game.questions.length - game.currentQuestionId -1;
		var difficulty = game.questions[game.currentQuestionId].difficulty;

		if(result == "correct"){
			$("#question").text("Correct! Difficulty: " + difficulty + ". " + questionsRemaining + " questions remaining");
			game.numCorrect++;
		}
		else if (result=="incorrect") {
			var userAnswer = $("#answer" + game.currentGuessId).html();
			$("#question").text(userAnswer + " is incorrect! Difficulty: " + difficulty + ". " + questionsRemaining + " questions remaining");
			game.numIncorrect++;
		}
		else if (result=="none"){
			$("#question").text( "Time's Up! Difficulty: " + difficulty + ". " + questionsRemaining + " questions remaining");
			game.numNoAnswer++;
		}
		game.currentQuestionId++;
		//clear countdown on-screen
		$("#countDown").empty();
		//if game over, move to end game after 3 seconds
		if(game.currentQuestionId >= game.questions.length){
			setTimeout(gameOver,3000);
		}
		//game must not be over, move to next question.  
		else {
		setTimeout(showQuestionAndAnswers,3000,game.currentQuestionId);
		}
	}

	//check if correct, add score based on basic difficulty multiplier. return results 
	var checkIfCorrect = function(){
		if(game.correctAnswerId == game.currentGuessId){
			
			var difficulty = game.questions[game.currentQuestionId].difficulty;
			if(difficulty =='easy'){
				game.score += 10;
			}
			else if(difficulty == 'medium'){
				game.score += 20;
			}
			else if (difficulty == 'hard'){
				game.score += 30;
			}
			return "correct";
		}
		else {
			return "incorrect";
			
		}
	}

	var gameOver = function(){
		game.mode = "gameOver";

		//build end game string, push to divs accordingly
		var correctString = "<li>Correct: " + game.numCorrect + " out of " + game.questions.length + " (" + parseInt((game.numCorrect/game.questions.length)*100) + "%)</li>";
		var incorrectString = "<li>Incorrect: " + game.numIncorrect + "</li>";
		var noAnswerString = "<li>No Answer: " + game.numNoAnswer + "</li>";
		var scoreString = "<li>Total Score: " + game.score + "</li>";
		var resultHTML = "<ul>" + scoreString + correctString + incorrectString + noAnswerString + "</ul>";  	
		$("#question").text("You've reached the end");
		$("#answerArea").addClass('hidden');
		$(".startDiv").removeClass('hidden');
		$("#resultArea").html(resultHTML).removeClass('hidden');
		//add all questions and answers as divs below main score area, for user reference
		for (i=0;i<game.questions.length;i++){
			var difficulty = game.questions[i].difficulty;
			var qList = $("<div>");
			var qListContent = "Q1: " + game.questions[i].question + "<br>Correct: " + game.questions[i].correct_answer + "<br>";
			qListContent += "Difficulty: " + difficulty + "<br>";
			qListContent += "Other Answers: " + game.questions[i].incorrect_answers.toString();
			qList.html(qListContent).addClass("panel");
			$("#allResults").append(qList);
		}
		$("#allResults").removeClass("hidden");
	}

	//show current time on screen, clear timeout when hits 0 (or I guess 1 second after)
	var countDown = function(){
		$("#countDown").text(game.timeRemaining);
		game.timeRemaining--;
		if(game.timeRemaining<0){
			clearInterval(timer);
			showCorrectAnswer("none");
			
		}
	}


	$("#startGame").click(function(){
		startGame();
	})


	$(".answer").click(function(){
		//only move on on click if we are in the right mode 
		if(game.mode=='receiveAnswers'){
			game.currentGuessId = $(this).attr("data-id");
			//check if correct answer
			var result = checkIfCorrect();
			showCorrectAnswer(result);
		}
	})



})