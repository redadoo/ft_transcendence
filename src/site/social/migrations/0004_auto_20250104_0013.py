# Generated by Django 5.1.1 on 2025-01-04 00:13

from django.db import migrations
from django.db import models

def delete_old_chatmessages(apps, schema_editor):
    ChatMessage = apps.get_model('social', 'ChatMessage')
    # Delete all existing rows in the ChatMessage table
    ChatMessage.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('social', '0003_initial'),
    ]

    operations = [
        # Step 1: Delete all old ChatMessage rows
        migrations.RunPython(delete_old_chatmessages),
        # Step 2: Add the non-nullable 'friendship' field
        migrations.AddField(
            model_name='chatmessage',
            name='friendship',
            field=models.ForeignKey(
                to='website.Friendships',
                on_delete=models.CASCADE,
                related_name='messages',
                help_text='Reference to the friendship.',
            ),
        ),
    ]
