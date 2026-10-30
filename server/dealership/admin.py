from django.contrib import admin
from .models import Dealer, Review, CarMake, CarModel

admin.site.register(Dealer)
admin.site.register(Review)
admin.site.register(CarMake)
admin.site.register(CarModel)