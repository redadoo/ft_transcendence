from rest_framework import serializers
from .models import LiarsBarMatch

class LiarsBarMatchSerializer(serializers.ModelSerializer):
	first_user_username = serializers.CharField(source='first_user.username', read_only=True)
	second_user_username = serializers.CharField(source='second_user.username', read_only=True)
	third_user_username = serializers.CharField(source='third_user.username', read_only=True)
	fourth_user_username = serializers.CharField(source='fourth_user.username', read_only=True)
	user_winner_username = serializers.CharField(source='user_winner.username', read_only=True)
	duration = serializers.SerializerMethodField()

	class Meta:
		model = LiarsBarMatch
		fields = [
			'id', 'first_user', 'first_user_username',
			'second_user', 'second_user_username',
			'third_user', 'third_user_username',
			'fourth_user', 'fourth_user_username',
			'user_winner', 'user_winner_username',
			'start_date', 'end_date', 'duration'
		]
		read_only_fields = ['start_date', 'user_winner_username', 'duration']

	def get_duration(self, obj):
		if obj.end_date:
			duration = obj.end_date - obj.start_date
			total_seconds = int(duration.total_seconds())
			minutes, seconds = divmod(total_seconds, 60)
			return f"{minutes}m {seconds}s"
		return "Match is still ongoing"
