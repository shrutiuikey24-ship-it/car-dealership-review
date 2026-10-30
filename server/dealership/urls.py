
from django.urls import path
from . import views

urlpatterns = [
    path("dealers/", views.dealers),
    path("dealers/<int:dealer_id>/", views.dealer_detail),
    path("dealers/<int:dealer_id>/reviews/", views.dealer_reviews),
    path("reviews/", views.reviews),
    path("car-makes/", views.car_makes),
    path("car-models/", views.car_models),
    path("states/", views.states),
    path("register/", views.register),
    path("login/", views.login_api),
    path("logout/", views.logout_api),
]
