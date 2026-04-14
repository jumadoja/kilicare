import graphene
from graphene_django import DjangoObjectType
from django.utils import timezone
from .models import LocalExperience, ExperienceMedia

class ExperienceMediaType(DjangoObjectType):
    class Meta:
        model = ExperienceMedia
        fields = "__all__"

class LocalExperienceType(DjangoObjectType):
    media_files = graphene.List(ExperienceMediaType)

    class Meta:
        model = LocalExperience
        fields = "__all__"

    def resolve_media_files(self, info):
        return self.media_files.all()

class Query(graphene.ObjectType):
    experiences = graphene.List(LocalExperienceType)
    today_near_me = graphene.List(LocalExperienceType, location=graphene.String())

    def resolve_experiences(self, info):
        return LocalExperience.objects.all().order_by('-created_at')

    def resolve_today_near_me(self, info, location=None):
        today = timezone.now().date()
        qs = LocalExperience.objects.filter(today_moment_active=True, today_moment_date=today)
        if location:
            qs = qs.filter(location__iexact=location)
        return qs

class CreateExperience(graphene.Mutation):
    experience = graphene.Field(LocalExperienceType)

    class Arguments:
        title = graphene.String(required=True)
        description = graphene.String()
        location = graphene.String()
        cultural_moment = graphene.String()
        availability = graphene.String()
        price_range = graphene.String()
        today_moment_text = graphene.String()
        today_moment_active = graphene.Boolean()
        today_moment_date = graphene.types.datetime.Date()

    def mutate(self, info, **kwargs):
        user = info.context.user
        if not user.is_authenticated or user.role != 'LOCAL' or not user.is_verified:
            raise Exception("Only verified locals can create experiences")
        experience = LocalExperience.objects.create(local=user, **kwargs)
        return CreateExperience(experience=experience)

class Mutation(graphene.ObjectType):
    create_experience = CreateExperience.Field()
