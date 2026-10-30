
from django.db import models
from django.contrib.auth.models import User


class Dealer(models.Model):
    full_name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    address = models.CharField(max_length=255, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    short_name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.full_name


class Review(models.Model):
    dealer = models.ForeignKey(
        Dealer, on_delete=models.CASCADE, related_name="reviews"
    )
    name = models.CharField(max_length=100, blank=True)
    purchase = models.BooleanField(default=False)
    review = models.TextField()
    sentiment = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    def save(self, *args, **kwargs):
        text = self.review.lower()
        positive = ["great", "excellent", "fantastic", "good", "friendly",
                    "helpful", "amazing", "wonderful", "love", "best"]
        negative = ["bad", "poor", "terrible", "awful", "rude",
                    "worst", "disappointed", "slow", "hate"]
        pos = sum(word in text for word in positive)
        neg = sum(word in text for word in negative)

        self.sentiment = (
            "positive" if pos > neg else
            "negative" if neg > pos else "neutral"
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Review for {self.dealer.full_name}"


class CarMake(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class CarModel(models.Model):
    make = models.ForeignKey(
        CarMake, on_delete=models.CASCADE, related_name="models"
    )
    name = models.CharField(max_length=100)
    year = models.PositiveIntegerField(default=2026)
    dealer = models.ForeignKey(
        Dealer, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return f"{self.make.name} {self.name}"
