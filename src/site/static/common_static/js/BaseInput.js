export default class BaseInput {

	constructor() {
		
		this.controls = {};
	}

	// Method to add an event listener and store it in the controls dictionary
	addEvent(eventName, handler) {

		// Store the handler in the dictionary
		this.controls[eventName] = handler;

		// Add the event listener to the window
		window.addEventListener(eventName, (event) => {
			// Execute the stored handler function
			this.controls[eventName](event);
		});
	}
}
