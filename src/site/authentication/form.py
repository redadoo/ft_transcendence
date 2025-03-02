from django import forms
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm, UserChangeForm as BaseUserChangeForm
from website.models import User

class UserCreationForm(BaseUserCreationForm):
    """Form for user registration."""
    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]

class UserChangeForm(BaseUserChangeForm):
    """Form for updating user details."""
    class Meta:
        model = User
        fields = ["username", "email"]

class LoginForm(forms.Form):
    """Form for user login."""
    username = forms.CharField(max_length=150, required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)
