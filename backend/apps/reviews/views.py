from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Review, Report, ReviewVote
from .serializers import (
    ReviewSerializer, ReportSerializer, AdminReportSerializer,
    VoteSerializer, ReportInputSerializer,
)


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]


# ── FBV: голосование ──────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def review_vote(request, pk):
    """
    Голосование за отзыв. Правила:
    - Повторное нажатие той же кнопки → снимает голос.
    - Нажатие противоположной кнопки → меняет голос.
    - helpful_votes может быть отрицательным.
    """
    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = VoteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    new_value = 1 if serializer.validated_data['vote'] == 'up' else -1
    existing  = ReviewVote.objects.filter(review=review, voter=request.user).first()

    if existing:
        if existing.value == new_value:
            # Та же кнопка → снять голос
            review.helpful_votes -= existing.value
            review.save(update_fields=['helpful_votes'])
            existing.delete()
        else:
            # Противоположная кнопка → переключить
            review.helpful_votes -= existing.value
            review.helpful_votes += new_value
            review.save(update_fields=['helpful_votes'])
            existing.value = new_value
            existing.save(update_fields=['value'])
    else:
        # Новый голос
        review.helpful_votes += new_value
        review.save(update_fields=['helpful_votes'])
        ReviewVote.objects.create(review=review, voter=request.user, value=new_value)

    # Возвращаем текущий голос пользователя (null если снят)
    current_vote = ReviewVote.objects.filter(review=review, voter=request.user).first()
    return Response({
        'helpful_votes': review.helpful_votes,
        'user_vote': current_vote.value if current_vote else None,
    })


# ── FBV: жалоба ──────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def review_report(request, pk):
    """Создать жалобу на отзыв."""
    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Проверяем входные данные через plain Serializer
    input_ser = ReportInputSerializer(data=request.data)
    if not input_ser.is_valid():
        return Response(input_ser.errors, status=status.HTTP_400_BAD_REQUEST)

    # Один пользователь не может жаловаться дважды на один отзыв
    if Report.objects.filter(review=review, reporter=request.user).exists():
        return Response({'error': 'You have already reported this review.'}, status=status.HTTP_400_BAD_REQUEST)

    report = Report.objects.create(
        review=review,
        reporter=request.user,
        reason=input_ser.validated_data['reason'],
    )
    return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)


# ── CBV: список жалоб (admin) ─────────────────────────────────────────────────
class AdminReportListView(generics.ListAPIView):
    queryset = Report.objects.filter(status='open').select_related('review', 'reporter').order_by('-created_at')
    serializer_class = AdminReportSerializer
    permission_classes = [permissions.IsAdminUser]


# ── CBV: действие по жалобе (admin) ──────────────────────────────────────────
class AdminReportActionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'hide_review':
            report.review.is_hidden = True
            report.review.save(update_fields=['is_hidden'])
            report.status = 'resolved'
            report.save(update_fields=['status'])
        elif action == 'dismiss':
            report.status = 'resolved'
            report.save(update_fields=['status'])
        elif action == 'ban_user':
            report.review.author.is_active = False
            report.review.author.save(update_fields=['is_active'])
            report.status = 'resolved'
            report.save(update_fields=['status'])
        else:
            return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': f'Action "{action}" applied.'})
