from rest_framework import serializers
from .models import Tip

class TipCreateSerializer(serializers.ModelSerializer):
    # Hii inahakikisha sub_topics ni array ya strings
    sub_topics = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False
    )

    class Meta:
        model = Tip
        fields = [
            "title",
            "description",
            "category",
            "sub_topics",
            "latitude",
            "longitude",
        ]


class TipListSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source="created_by.username")
    sub_topics = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False
    )

    class Meta:
        model = Tip
        fields = [
            "id",
            "title",
            "description",
            "category",
            "sub_topics",
            "latitude",
            "longitude",
            "created_by",
            "upvotes",
            "created_at",
        ]