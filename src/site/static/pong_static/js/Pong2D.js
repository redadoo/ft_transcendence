import Game from './Game.js';
import PongPlayer from './utils/PongPlayer.js';

export default class Pong2D extends Game 
{
	constructor()
	{
		super();

		this.canvas = null;
		this.ctx = null;
	}

	init(player_id)
	{
		this.canvas = document.getElementById('gameCanvas');
		this.ctx = this.canvas.getContext('2d');
		
		super.init(player_id);		
	}

	initScene(data)
	{
		super.initScene(data);
		document.getElementById('pongJs').classList.remove('d-none');

		this.ball.init("2D");
	}

	AddUserToLobby(newPlayer_id, playerData, socket)
	{
		if (newPlayer_id == this.player_id && this.pongPlayer == null)
			this.pongPlayer = new PongPlayer(socket, this.player_id, playerData);
		else if (this.pongOpponent == null)
			this.pongOpponent = new PongPlayer(null, newPlayer_id, playerData);
	}

	addPlayersToScene(){}

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

	animate()
	{
		const animateLoop = () => {
			this.draw();
			window.requestAnimationFrame(animateLoop);
		};
		animateLoop();
	}

	game_ended(isGamefinished, pathToRedirect)
	{
		document.getElementById('pongJs').classList.add('d-none');
		super.game_ended(isGamefinished, pathToRedirect);
	}
}
