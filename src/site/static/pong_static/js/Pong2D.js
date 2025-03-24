import Game from './Game.js';
import PongPlayer from './utils/PongPlayer.js';

/**
 * @class Pong2D
 * @extends Game
 * 
 * Pong2D is a subclass of the Game class that manages the 2D rendering and logic 
 * for a Pong game. It extends the parent class and adds specific functionalities 
 * for handling the 2D canvas drawing, player interactions, and score updates.
 */
export default class Pong2D extends Game {
	/**
	 * Creates an instance of the Pong2D game.
	 * Initializes the canvas and the 2D drawing context.
	 */
	constructor() {
		super();
		this.canvas = null;  // HTML canvas element used for rendering the game
		this.ctx = null;     // 2D rendering context for the canvas
	}

	/**
	 * Initializes the game, setting up the 2D canvas and calling the parent class's init method.
	 * @param {string} player_id - The ID of the player starting the game.
	 */
	init(player_id) 
	{
		this.canvas = document.getElementById('gameCanvas');
		this.ctx = this.canvas.getContext('2d');
		super.init(player_id);		
	}

	/**
	 * Initializes the game scene with the provided data, including setting up the ball and players.
	 * @param {Object} data - The data used to initialize the scene, including ball and player info.
	 */
	initScene(data) 
	{
		super.initScene(data);
		document.getElementById('pongJs').classList.remove('d-none');
		this.ball.init("2D");
	}

	/**
	 * Adds a new player to the lobby and creates a PongPlayer instance for the player and the opponent.
	 * @param {string} newPlayer_id - The ID of the new player.
	 * @param {Object} playerData - The data associated with the new player (e.g., paddle position).
	 * @param {Object} socket - The socket connection for the player.
	 */
	AddUserToLobby(newPlayer_id, playerData, socket) 
	{
		if (newPlayer_id == this.player_id && this.pongPlayer == null)
		{
			if (this.pongOpponent == null)
			{
				this.isOpponentFirst = true;
			}

			this.pongPlayer = new PongPlayer(socket, this.player_id, playerData);
		}
		else if (this.pongOpponent == null)
		{
			this.pongOpponent = new PongPlayer(null, newPlayer_id, playerData);
		}

		console.log("this.isOpponentFirst", this.isOpponentFirst);
	}

	/**
	 * Placeholder method that can be implemented for adding players to the scene in custom ways.
	 */
	addPlayersToScene() {}

	/**
	 * Draws the scores for both players on the canvas.
	 * The scores are displayed at the top of the canvas, with a vertical line separating them.
	 */
	drawScores() 
	{
		this.ctx.fillStyle = "#fff";                
		this.ctx.font = "bold 48px monospace"; 
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "top";           
		
		const leftX = this.canvas.width * 0.25;
		const rightX = this.canvas.width * 0.75;
		const scoreY = 20;
		
		this.ctx.fillText(this.lastScore.player1, leftX, scoreY);
		this.ctx.fillText(this.lastScore.player2, rightX, scoreY);
		
		this.ctx.beginPath();
		this.ctx.setLineDash([10, 10]);
		this.ctx.moveTo(this.canvas.width / 2, 0);
		this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
		this.ctx.strokeStyle = "#fff";
		this.ctx.stroke();
	}

	/**
	 * Renders the game elements (ball, paddles, and scores) on the canvas.
	 * Clears the canvas each frame before rendering the updated game state.
	 */
	draw() 
	{
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
		if (this.ball != null)
			this.ball.render2D(this.ctx);
		
		if (this.pongPlayer != null)
			this.pongPlayer.paddle.render2D(this.ctx);
		
		if (this.pongOpponent != null)
			this.pongOpponent.paddle.render2D(this.ctx);
		
		this.drawScores(); 
	}

	/**
	 * Starts the animation loop to continuously render the game state.
	 * Uses the browser's requestAnimationFrame for smooth animation.
	 */
	animate() 
	{
		const animateLoop = () => {
			this.draw();
			window.requestAnimationFrame(animateLoop);
		};
		animateLoop();
	}

	/**
	 * Handles the end of the game by cleaning up and redirecting the user to another page.
	 * @param {boolean} isGamefinished - Indicates whether the game ended in a finished state.
	 * @param {string} pathToRedirect - The path to redirect the user to after the game ends.
	 */
	game_ended(isGamefinished, pathToRedirect) 
	{
		document.getElementById('pongJs').classList.add('d-none');
		super.game_ended(isGamefinished, pathToRedirect);
	}

	reset()
	{
		super.reset();

		if (this.pongPlayer != null)
		{
			delete this.pongPlayer;
			this.pongPlayer = null;
		}
		if (this.pongOpponent != null)
		{
			delete this.pongOpponent;
			this.pongOpponent = null;
		}
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

	}
}
