from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CourseInstance, SyllabusVersion
from .serializers import CourseInstanceDetailSerializer, CourseInstanceCompareSerializer


class CourseInstanceDetailView(generics.RetrieveAPIView):
    queryset = CourseInstance.objects.all()
    serializer_class = CourseInstanceDetailSerializer
    permission_classes = [permissions.AllowAny]


class CourseInstanceCompareView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ids_param = request.query_params.get('ids', '')
        try:
            ids = [int(i) for i in ids_param.split(',') if i.strip()]
        except ValueError:
            return Response({'error': 'Invalid ids parameter.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(ids) < 2:
            return Response({'error': 'Provide at least 2 ids.'}, status=status.HTTP_400_BAD_REQUEST)

        instances = CourseInstance.objects.filter(id__in=ids)
        serializer = CourseInstanceCompareSerializer(instances, many=True, context={'request': request})
        return Response(serializer.data)


class AdminMassSyllabusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        subject_id = request.data.get('subject_id')
        teacher_ids = request.data.get('teacher_ids', [])
        year = request.data.get('year')
        file = request.FILES.get('file')

        if not all([subject_id, teacher_ids, year, file]):
            return Response(
                {'error': 'subject_id, teacher_ids, year, and file are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        syllabus = SyllabusVersion.objects.create(
            file=file,
            year=year,
            uploaded_by=request.user if not request.user.is_anonymous else None,
        )

        instances = CourseInstance.objects.filter(
            subject_id=subject_id,
            teacher_id__in=teacher_ids,
        )
        for ci in instances:
            ci.syllabus_history.add(syllabus)

        return Response({
            'message': f'Syllabus linked to {instances.count()} course instances.',
            'syllabus_id': syllabus.id,
        }, status=status.HTTP_201_CREATED)
