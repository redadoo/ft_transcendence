from django import forms
from .models import UserImage
from django.core.exceptions import ValidationError

class UserImageForm(forms.ModelForm):
    class Meta:
        model = UserImage
        fields = ['user_avatar']

    # Limit image size to 2MB (2 * 1024 * 1024 bytes)
    MAX_IMAGE_SIZE = 2 * 1024 * 1024

    def clean_user_avatar(self):
        user_avatar = self.cleaned_data.get('user_avatar')

        if user_avatar:
            if user_avatar.size > self.MAX_IMAGE_SIZE:
                raise ValidationError("The image file is too large. Max size is 2MB.")

        return user_avatar
