/**
 * BaseInput class for managing event listeners.
 */
export default class BaseInput {

	/**
	 * Creates an instance of BaseInput.
	 * Initializes an object to store event handlers.
	 */
	constructor() {
		this.controls = {};
	}

	/**
	 * Adds an event listener for a specified event.
	 * @param {string} eventName - The name of the event (e.g., 'click', 'keydown').
	 * @param {Function} handler - The function to execute when the event occurs.
	 */
	addEvent(eventName, handler) 
	{
		this.controls[eventName] = handler;
		window.addEventListener(eventName, (event) => {
			this.controls[eventName](event);
		});
	}
}
