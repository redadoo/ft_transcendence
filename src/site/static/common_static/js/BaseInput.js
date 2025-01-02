export default class BaseInput {

	constructor() {
		
		this.controls = {};
	}

	addEvent(eventName, handler) 
	{
		this.controls[eventName] = handler;
		window.addEventListener(eventName, (event) => {
			this.controls[eventName](event);
		});
	}
}
