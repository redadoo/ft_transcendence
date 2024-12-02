import Paddle from './Paddle.js';

export default class PongAI{

	constructor(data) 
	{
		this.paddle = new Paddle(data.width, data.height,  data.depth,  data.color);
		
		this.newY = data.y;
		this.paddle.mesh.position.y = data.y;
		this.paddle.mesh.position.x = data.x;
	}
}