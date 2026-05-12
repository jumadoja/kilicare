import graphene
from graphene_django import DjangoObjectType
from django.utils import timezone
from django.core.paginator import Paginator, EmptyPage
from graphql import GraphQLError
from .models import LocalExperience, ExperienceMedia
from core.decorators.graphql_permissions import login_required_graphql, role_required, verified_required

class ExperienceMediaType(DjangoObjectType):
    class Meta:
        model = ExperienceMedia
        fields = ("id", "file", "media_type", "uploaded_at")

class LocalExperienceType(DjangoObjectType):
    media_files = graphene.List(ExperienceMediaType)

    class Meta:
        model = LocalExperience
        fields = ("id", "title", "description", "location", "category", "cultural_moment", 
                  "availability", "price_range", "today_moment_text", "today_moment_active", 
                  "today_moment_date", "created_at")

    def resolve_media_files(self, info):
        return self.media_files.all()

class ExperienceConnection(graphene.ObjectType):
    edges = graphene.List(LocalExperienceType)
    page_info = graphene.Field(graphene.ObjectType)
    total_count = graphene.Int()

class PageInfo(graphene.ObjectType):
    has_next = graphene.Boolean()
    has_previous = graphene.Boolean()
    page = graphene.Int()
    pages = graphene.Int()

class Query(graphene.ObjectType):
    experiences = graphene.Field(ExperienceConnection, page=graphene.Int(), per_page=graphene.Int())
    today_near_me = graphene.Field(ExperienceConnection, location=graphene.String(), page=graphene.Int(), per_page=graphene.Int())

    def resolve_experiences(self, info, page=1, per_page=20):
        if per_page > 50:
            raise GraphQLError("Maximum per_page limit is 50")
        
        queryset = LocalExperience.objects.select_related('local').prefetch_related('media_files').order_by('-created_at')
        
        paginator = Paginator(queryset, per_page)
        try:
            experiences_page = paginator.page(page)
        except EmptyPage:
            experiences_page = paginator.page(paginator.num_pages)
        
        return ExperienceConnection(
            edges=experiences_page.object_list,
            page_info=PageInfo(
                has_next=experiences_page.has_next(),
                has_previous=experiences_page.has_previous(),
                page=experiences_page.number,
                pages=paginator.num_pages
            ),
            total_count=queryset.count()
        )

    def resolve_today_near_me(self, info, location=None, page=1, per_page=20):
        if per_page > 50:
            raise GraphQLError("Maximum per_page limit is 50")
        
        today = timezone.now().date()
        queryset = LocalExperience.objects.select_related('local').prefetch_related('media_files').filter(
            today_moment_active=True, 
            today_moment_date=today
        )
        if location:
            queryset = queryset.filter(location__iexact=location)
        
        paginator = Paginator(queryset, per_page)
        try:
            experiences_page = paginator.page(page)
        except EmptyPage:
            experiences_page = paginator.page(paginator.num_pages)
        
        return ExperienceConnection(
            edges=experiences_page.object_list,
            page_info=PageInfo(
                has_next=experiences_page.has_next(),
                has_previous=experiences_page.has_previous(),
                page=experiences_page.number,
                pages=paginator.num_pages
            ),
            total_count=queryset.count()
        )

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

    @login_required_graphql
    @role_required('LOCAL_GUIDE')
    @verified_required
    def mutate(self, info, **kwargs):
        user = info.context.user
        experience = LocalExperience.objects.create(local=user, **kwargs)
        return CreateExperience(experience=experience)

class Mutation(graphene.ObjectType):
    create_experience = CreateExperience.Field()
