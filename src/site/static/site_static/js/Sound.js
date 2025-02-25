const Sound = {
	notificationSound: '/static/site_static/media/audio/notification.mp3',

	play: function(sound) {
		const audio = new Audio(this[sound]);
		audio.play();
	}
}

export default Sound;