const Sound = {
	notificationSound: '/static/site_static/media/audio/notification.mp3',
	navigationSound: '/static/site_static/media/audio/navigation.wav',

	play: function(sound) {
		const audio = new Audio(this[sound]);
		audio.play();
	}
}

export default Sound;