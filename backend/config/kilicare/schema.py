import graphene
from users.schema import Query as UsersQuery, Mutation as UsersMutation
from core.middleware.error_handler import graphql_error_middleware

class Query(UsersQuery, graphene.ObjectType):
    pass

class Mutation(UsersMutation, graphene.ObjectType):
    pass

schema = graphene.Schema(
    query=Query, 
    mutation=Mutation,
    middleware=[graphql_error_middleware]
)
