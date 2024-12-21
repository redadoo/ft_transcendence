from rest_framework import serializers
from .models import Friendships, UserStats, UserImage, MatchHistory, User
from rest_framework import serializers
from pong.serializers import PongMatchSerializer
from liarsbar.serializers import LiarsBarMatchSerializer
from pong.models import *

class UserStatsSerializer(serializers.ModelSerializer):
	level = serializers.ReadOnlyField()
	cap_exp = serializers.ReadOnlyField()
	percentage_next_level = serializers.ReadOnlyField()

	class Meta:
		model = UserStats
		fields = [
			'exp', 'mmr', 'win', 'lose', 'longest_winstreak',
			'total_points_scored', 'longest_game', 'time_on_site',
			'level', 'cap_exp', 'percentage_next_level', 'date_updated'
		]
		read_only_fields = [
			'level', 'cap_exp', 'percentage_next_level', 'date_updated'
		]

class UserImageSerializer(serializers.ModelSerializer):
	avatar_url = serializers.ImageField(source='user_avatar', read_only=True)
	class Meta:
		model = UserImage
		fields = ['avatar_url']

class MatchHistorySerializer(serializers.ModelSerializer):
    pong_matches = PongMatchSerializer(many=True, read_only=True)
    liarsbar_matches = LiarsBarMatchSerializer(many=True, read_only=True)
    all_matches = serializers.SerializerMethodField()

    class Meta:
        model = MatchHistory
        fields = ['user', 'pong_matches', 'liarsbar_matches', 'all_matches']
        read_only_fields = ['all_matches']

    def get_all_matches(self, obj):
        matches = obj.get_all_matches()
        return [
            {
                'type': 'Pong Match' if isinstance(match, PongMatch) else 'Liars Bar Match',
                'details': (
                    PongMatchSerializer(match).data
                    if isinstance(match, PongMatch) else LiarsBarMatchSerializer(match).data
                ),
            }
            for match in matches
        ]

class UserProfileSerializer(serializers.ModelSerializer):
	image_url = UserImageSerializer(source='user_image', read_only=True)
	stat = UserStatsSerializer(source='user_stat', read_only=True)
	friendships = serializers.SerializerMethodField()
	history = MatchHistorySerializer(source='match_history', many=True, read_only=True)

	class Meta:
		model = User
		fields = ['id', 'username', 'email', 'created_at', 'status','image_url', 'stat', 'friendships', 'history']
		read_only_fields = ['id', 'username', 'email', 'created_at', 'status','image_url', 'stat', 'friendships', 'history']

	def __init__(self, *args, **kwargs):
		fields = kwargs.pop('fields', None)
		super().__init__(*args, **kwargs)
		
		if fields:
			allowed = set(fields)
			existing = set(self.fields)
			for field_name in existing - allowed:
				self.fields.pop(field_name)

	def get_friendships(self, obj):
		current_user = self.context['request'].user

		friendships = (
			Friendships.objects
			.filter(models.Q(first_user=obj) | models.Q(second_user=obj))
			.select_related('first_user', 'second_user')
		)

		friendships_data = [
			{
				'status_display': friendship.get_status_display(),
				'other_user_username': (
					friendship.second_user.username 
					if friendship.first_user == current_user 
					else friendship.first_user.username
				),
			}
			for friendship in friendships
			if not (friendship.status == Friendships.FriendshipsStatus.PENDING and friendship.first_user == current_user)
		]

		return friendships_data



	
class SimpleUserProfileSerializer(serializers.ModelSerializer):
    image_url = UserImageSerializer(source='user_image', read_only=True)
    status = serializers.CharField(source='get_status_display', read_only=True)
	
    class Meta:
        model = User
        fields = ['username', 'image_url', 'status']
        read_only_fields = ['username', 'image_url', 'status']

    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)
        
        if fields:
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)