from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import StudyMaterial
from .serializers import StudyMaterialSerializer, AdminStudyMaterialSerializer


class StudyMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET /materials/<pk>/ — retrieve. PUT/PATCH/DELETE — requires authentication."""
    queryset = StudyMaterial.objects.all()
    serializer_class = StudyMaterialSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class StudyMaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyMaterialSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return StudyMaterial.objects.filter(status='approved').order_by('-created_at')
        return StudyMaterial.objects.all()


class AdminMaterialModerationView(generics.ListAPIView):
    queryset = StudyMaterial.objects.filter(status='pending').order_by('-created_at')
    serializer_class = AdminStudyMaterialSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminMaterialActionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            material = StudyMaterial.objects.get(pk=pk)
        except StudyMaterial.DoesNotExist:
            return Response({'error': 'Material not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'approve':
            material.status = 'approved'
            material.save()
            return Response({'message': 'Material approved.'})
        elif action == 'reject':
            material.status = 'rejected'
            material.save()
            return Response({'message': 'Material rejected.'})
        else:
            return Response({'error': 'action must be "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)
