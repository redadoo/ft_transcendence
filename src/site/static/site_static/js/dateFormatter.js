const dateFormatter = {
	formatDateString(isoString) {
		const date = new Date(isoString);
		return date.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).replace(',', ' -');
	},

	formatDuration(durationString) {
		const [_, minutes, seconds] = durationString.match(/(\d+)m\s*(\d+)s/) || [null, '0', '0'];
		const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);

		const formattedMinutes = Math.floor(totalSeconds / 60);
		const formattedSeconds = totalSeconds % 60;

		return `${formattedMinutes} min ${formattedSeconds} sec`;
	}
};

export default dateFormatter;