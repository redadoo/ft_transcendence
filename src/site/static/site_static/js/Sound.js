const Sound = {
	notificationSound: '/static/site_static/media/audio/notification.mp3',
	navigationSound: '/static/site_static/media/audio/navigation.wav',
	startGameSound: '/static/site_static/media/audio/game-start.mp3',
	matchmakingSound: '/static/site_static/media/audio/matchmakingButton.mp3',
	backSound: '/static/site_static/media/audio/backButtonSound.mp3',
	clickProfileSound: '/static/site_static/media/audio/clickProfileSound.mp3',
	foundMatch: '/static/site_static/media/audio/foundMatch.mp3',
	uiClick: '/static/site_static/media/audio/ui-click.mp3',
	profileHoverSound: '/static/site_static/media/audio/profileHoverSound.mp3',
	navigatioPageSound: '/static/site_static/media/audio/navigatioPageSound.mp3',
	uiButtonNavigation: '/static/site_static/media/audio/uiButtonNavigation.mp3',

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