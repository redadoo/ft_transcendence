from django.contrib import admin
from website.models import UserImage, MatchHistory, UserStats
from .models import Friendships
from django.contrib import admin
from website.models import User 
from django.contrib.auth.admin import UserAdmin
from authentication.form import UserCreationForm, UserChangeForm

class UserAdmin(UserAdmin):
    """
    Custom admin interface for managing users.
    """
    add_form = UserCreationForm
    form = UserChangeForm
    model = User

    list_display = ["id", "username", "email", "status", "created_at", "updated_at"]
    search_fields = ["username", "email"]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal Info", {"fields": ("email", "status")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2", "is_staff", "is_active"),
        }),
    )

class MatchHistoryAdmin(admin.ModelAdmin):
    """
    Admin interface for managing MatchHistory.
    """
    list_display = ("user",)
    search_fields = ("user__username",)
    filter_horizontal = ("pong_matches", "liarsbar_matches")
    autocomplete_fields = ["user"]

class FriendshipsAdmin(admin.ModelAdmin):
    list_display = ('first_user', 'second_user', 'status', 'date_created', 'date_updated')
    
    list_filter = ('status',)
    
    search_fields = ('first_user__username', 'second_user__username')
    
    ordering = ('-date_created',)
    
    actions = ['mark_as_friends', 'mark_as_pending', 'mark_as_blocked']
    
    def mark_as_friends(self, request, queryset):
        queryset.update(status=Friendships.FriendshipsStatus.FRIENDS)
        self.message_user(request, "Selected friendships marked as 'Friends'")
    mark_as_friends.short_description = "Mark selected as Friends"

    def mark_as_pending(self, request, queryset):
        queryset.update(status=Friendships.FriendshipsStatus.PENDING)
        self.message_user(request, "Selected friendships marked as 'Pending'")
    mark_as_pending.short_description = "Mark selected as Pending"

    def mark_as_blocked(self, request, queryset):
        queryset.update(status=Friendships.FriendshipsStatus.BLOCK)
        self.message_user(request, "Selected friendships marked as 'Blocked'")
    mark_as_blocked.short_description = "Mark selected as Blocked"


admin.site.register(User, UserAdmin)
admin.site.register(UserStats)
admin.site.register(UserImage)
admin.site.register(MatchHistory, MatchHistoryAdmin)
admin.site.register(Friendships, FriendshipsAdmin)
