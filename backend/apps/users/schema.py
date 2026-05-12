import graphene
import graphql_jwt
from graphene_django import DjangoObjectType
from graphql import GraphQLError
from .models import User, Profile
from core.decorators.graphql_permissions import login_required_graphql

class ProfileType(DjangoObjectType):
    class Meta:
        model = Profile
        fields = ("id", "phone_number", "bio", "avatar", "gender", "dob", "location")

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "is_verified", "profile")

class Query(graphene.ObjectType):
    me = graphene.Field(UserType)

    @login_required_graphql
    def resolve_me(self, info):
        user = info.context.user
        return user

class ObtainToken(graphene.Mutation):
    user = graphene.Field(UserType)
    access = graphene.String()
    refresh = graphene.String()

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    def mutate(self, info, username, password):
        user = User.objects.select_related('profile').filter(username=username).first()
        if not user or not user.check_password(password):
            raise GraphQLError("Invalid credentials")

        refresh = graphql_jwt.shortcuts.get_token(user)
        access = graphql_jwt.shortcuts.create_access_token(user)

        return ObtainToken(user=user, access=access, refresh=refresh)

class Mutation(graphene.ObjectType):
    login = ObtainToken.Field()


