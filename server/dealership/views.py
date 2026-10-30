
import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404

from .models import Dealer, Review, CarMake, CarModel


def dealer_data(dealer):
    return {
        "id": dealer.id,
        "full_name": dealer.full_name,
        "city": dealer.city,
        "state": dealer.state,
        "address": dealer.address,
        "zip": dealer.zip_code,
        "short_name": dealer.short_name,
    }


def review_data(review):
    return {
        "id": review.id,
        "dealer_id": review.dealer_id,
        "name": review.name,
        "review": review.review,
        "purchase": review.purchase,
        "sentiment": review.sentiment,
        "created_at": review.created_at.isoformat(),
    }


def read_body(request):
    try:
        return json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def dealers(request):
    if request.method == "GET":
        qs = Dealer.objects.all()
        state = request.GET.get("state")
        if state:
            qs = qs.filter(state__iexact=state)
        return JsonResponse([dealer_data(d) for d in qs], safe=False)

    if request.method == "POST":
        data = read_body(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        required = ["full_name", "city", "state"]
        if not all(data.get(k) for k in required):
            return JsonResponse(
                {"error": "full_name, city, and state are required"},
                status=400,
            )
        dealer = Dealer.objects.create(
            full_name=data["full_name"],
            city=data["city"],
            state=data["state"],
            address=data.get("address", ""),
            zip_code=data.get("zip", ""),
            short_name=data.get("short_name", ""),
        )
        return JsonResponse(dealer_data(dealer), status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


def dealer_detail(request, dealer_id):
    dealer = get_object_or_404(Dealer, pk=dealer_id)
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    result = dealer_data(dealer)
    result["reviews"] = [
        review_data(r) for r in dealer.reviews.all().order_by("-created_at")
    ]
    return JsonResponse(result)


@csrf_exempt
def dealer_reviews(request, dealer_id):
    dealer = get_object_or_404(Dealer, pk=dealer_id)
    if request.method == "GET":
        qs = dealer.reviews.all().order_by("-created_at")
        return JsonResponse([review_data(r) for r in qs], safe=False)

    if request.method == "POST":
        data = read_body(request)
        if data is None or not data.get("review"):
            return JsonResponse({"error": "A review is required"}, status=400)

        review = Review.objects.create(
            dealer=dealer,
            name=data.get("name", ""),
            review=data["review"],
            purchase=bool(data.get("purchase", False)),
            user=request.user if request.user.is_authenticated else None,
        )
        return JsonResponse(review_data(review), status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


def reviews(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    return JsonResponse(
        [review_data(r) for r in Review.objects.all().order_by("-created_at")],
        safe=False,
    )


def car_makes(request):
    data = [
        {"id": m.id, "name": m.name, "description": m.description}
        for m in CarMake.objects.all()
    ]
    return JsonResponse(data, safe=False)


def car_models(request):
    qs = CarModel.objects.select_related("make").all()
    make_id = request.GET.get("make_id")
    if make_id:
        qs = qs.filter(make_id=make_id)
    data = [
        {
            "id": m.id,
            "name": m.name,
            "year": m.year,
            "make_id": m.make_id,
            "make": m.make.name,
            "dealer_id": m.dealer_id,
        }
        for m in qs
    ]
    return JsonResponse(data, safe=False)


@csrf_exempt
def register(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    data = read_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "")
    if not username or not password:
        return JsonResponse(
            {"error": "username and password are required"}, status=400
        )
    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        email=data.get("email", ""),
    )
    return JsonResponse({"id": user.id, "username": user.username}, status=201)


@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    data = read_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    user = authenticate(
        request,
        username=data.get("username", ""),
        password=data.get("password", ""),
    )
    if user is None:
        return JsonResponse({"error": "Invalid credentials"}, status=401)
    login(request, user)
    return JsonResponse({"message": "Login successful", "username": user.username})


@csrf_exempt
def logout_api(request):
    logout(request)
    return JsonResponse({"message": "Logout successful"})


def states(request):
    values = Dealer.objects.order_by("state").values_list("state", flat=True)
    return JsonResponse(list(values.distinct()), safe=False)
