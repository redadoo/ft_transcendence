const Sound = {
	notificationSound: '/static/site_static/media/audio/notification.mp3',
	navigationSound: '/static/site_static/media/audio/navigation.wav',
	startGameSound: '/static/site_static/media/audio/game-start.mp3',
	matchmakingSound: '/static/site_static/media/audio/game-start.mp3',

	play: function(sound) {
	  const audio = new Audio(this[sound]);
	  audio.muted = true;
	  audio.play().then(() => {
		setTimeout(() => {
		  audio.muted = false;
		}, 100);
	  }).catch(error => {
		console.error('Playback failed: ', error);
	  });
	}
};
  
export default Sound;