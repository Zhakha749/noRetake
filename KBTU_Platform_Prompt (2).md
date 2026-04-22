# MASTER PROMPT: KBTU Academic Transparency Platform
## For use with Claude Code / AI-assisted development tools

---

## ROLE & CONTEXT

You are an expert full-stack developer. Your task is to build a **demo web application** called the **"KBTU Academic Transparency Platform"** — a Rate-My-Professor-style site tailored for KBTU students. The platform helps students make informed decisions when choosing courses and teachers based on ratings, reviews, difficulty metrics, grade statistics, and study materials.

This is a **portfolio/demo project**. Prioritize clean, readable, well-structured code over complex infrastructure. All data will be locally stored and seeded with realistic generated demo data.

---

## TECH STACK (STRICT — DO NOT DEVIATE)

| Layer | Technology |
|---|---|
| **Frontend** | Angular 17+ (Standalone Components, Angular Router) |
| **Backend** | Django 4.2+ with Django REST Framework (DRF) |
| **Database** | PostgreSQL (local) |
| **Auth** | JWT via `djangorestframework-simplejwt` |
| **Charts** | Chart.js (via `ng2-charts` wrapper) |
| **Styling** | Angular Material + custom SCSS (dark mode support required) |
| **File Storage** | Django local `MEDIA_ROOT` (no S3/Cloudinary for demo) |
| **CORS** | `django-cors-headers` (allow `localhost:4200`) |

---

## PROJECT STRUCTURE

```
project-root/
├── backend/               # Django project
│   ├── config/            # settings.py, urls.py, wsgi.py
│   ├── apps/
│   │   ├── teachers/      # Teacher model and API
│   │   ├── subjects/      # Subject model and API
│   │   ├── courses/       # CourseInstance (pivot) model and API
│   │   ├── reviews/       # Review and Report models and API
│   │   ├── materials/     # StudyMaterial model and API
│   │   └── users/         # Custom User model and Auth API
│   ├── management/
│   │   └── commands/
│   │       ├── fill_demo_data.py   # Demo data seeder
│   │       └── scrape_university.py # Placeholder scraper
│   └── requirements.txt
│
└── frontend/              # Angular project
    └── src/
        ├── app/
        │   ├── core/          # Auth service, interceptors, guards
        │   ├── shared/        # Shared components (navbar, footer, cards)
        │   ├── features/
        │   │   ├── home/
        │   │   ├── teachers/
        │   │   ├── subjects/
        │   │   ├── course-detail/
        │   │   └── admin-dashboard/
        │   └── app.routes.ts
        └── environments/
```

---

## PART 1: BACKEND (Django)

### 1.1 Data Models

#### `users/models.py` — Custom User
```python
class Student(AbstractUser):
    university_email = models.EmailField(unique=True)  # must end in @kbtu.kz
    is_verified = models.BooleanField(default=False)    # verified via email domain
    karma = models.IntegerField(default=0)              # increases when materials get approved
```

#### `teachers/models.py`
```python
class Teacher(models.Model):
    AGE_RANGES = [('20-30','20-30'), ('30-40','30-40'), ('40-50','40-50'), ('50-60','50-60'), ('60+','60+')]
    
    full_name       = models.CharField(max_length=200)
    photo           = models.ImageField(upload_to='teachers/', blank=True)
    description     = models.TextField()                   # Admin-written characteristic
    age_range       = models.CharField(max_length=10, choices=AGE_RANGES)
    is_verified     = models.BooleanField(default=True)
    gender_bias_score = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    # gender_bias_score: computed average of sensitive_marker reports.
    # Only displayed in UI if score > 3.0 AND confirmed by 10+ users

    def get_average_ratings(self):
        # Returns dict: {clarity, objectivity, accessibility, workload}
        pass

    def get_teaching_history(self):
        # Returns list of {year_interval, subject_name, role} - deduplicated
        pass
```

#### `subjects/models.py`
```python
class Subject(models.Model):
    CATEGORY_CHOICES = [
        ('mandatory', 'Mandatory'),
        ('elective', 'Elective'),
        ('major', 'Major'),
        ('minor', 'Minor'),
        ('profile', 'Profile'),
    ]
    title               = models.CharField(max_length=200)
    category            = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    credits             = models.IntegerField()
    description         = models.TextField()

    @property
    def overall_difficulty(self):
        # Avg of all CourseInstance difficulty ratings
        pass

    @property
    def teacher_dependency_ratio(self):
        # Std deviation of difficulty across teachers → high = depends on teacher
        pass
```

#### `courses/models.py` — CourseInstance (the CORE of the project)
```python
class CourseInstance(models.Model):
    teacher         = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='course_instances')
    subject         = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='course_instances')
    year_interval   = models.CharField(max_length=20)   # e.g. "2021–2024"
    role            = models.CharField(max_length=50)   # "Lecturer", "Practice", "Labs", "All"
    grading_policy  = models.TextField()                 # Midterm 30%, Final 40%, etc.
    weekly_plan     = models.JSONField(default=list)     # [{week: 1, topic: "...", type: "lecture"}]
    grade_distribution = models.JSONField(default=dict) # {"A": 10, "A-": 5, "B+": 8, ...}
    syllabus_history   = models.ManyToManyField('SyllabusVersion', blank=True)

class SyllabusVersion(models.Model):
    file        = models.FileField(upload_to='syllabi/')
    year        = models.IntegerField()
    uploaded_by = models.ForeignKey('users.Student', null=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

#### `reviews/models.py`
```python
class Review(models.Model):
    author          = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    course_instance = models.ForeignKey(CourseInstance, on_delete=models.CASCADE, related_name='reviews')
    text            = models.TextField()
    rating          = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    difficulty_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    # Radar chart axes:
    clarity_rating      = models.IntegerField(default=5)
    objectivity_rating  = models.IntegerField(default=5)
    accessibility_rating = models.IntegerField(default=5)
    workload_rating     = models.IntegerField(default=5)
    
    is_anonymous    = models.BooleanField(default=True)
    is_hidden       = models.BooleanField(default=False)  # auto-set if reports > 5
    sensitive_markers = models.JSONField(default=dict)    # {"gender_bias": true, "favoritism": false}
    helpful_votes   = models.IntegerField(default=0)
    created_at      = models.DateTimeField(auto_now_add=True)
    took_this_course = models.BooleanField(default=False) # "I took this course" checkbox

class Report(models.Model):
    review      = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reports')
    reporter    = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    reason      = models.TextField()
    status      = models.CharField(max_length=20, choices=[('open','Open'),('resolved','Resolved')], default='open')
    created_at  = models.DateTimeField(auto_now_add=True)
```

#### `materials/models.py`
```python
class StudyMaterial(models.Model):
    STATUS = [('pending','Pending'), ('approved','Approved'), ('rejected','Rejected')]
    TYPE   = [('lecture','Lecture Notes'), ('exam','Past Exams'), ('book','Book/Reference'), ('other','Other')]
    
    title       = models.CharField(max_length=200)
    link        = models.URLField(blank=True)
    file        = models.FileField(upload_to='materials/', blank=True)
    type        = models.CharField(max_length=20, choices=TYPE)
    status      = models.CharField(max_length=20, choices=STATUS, default='pending')
    subject     = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE, related_name='materials')
    contributor = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    created_at  = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        # On approval: contributor.karma += 5
        pass
```

---

### 1.2 API Endpoints (DRF)

All endpoints under `/api/v1/`:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/` | Public | Register with @kbtu.kz email |
| POST | `/auth/login/` | Public | Returns JWT tokens |
| POST | `/auth/refresh/` | Public | Refresh JWT |
| GET | `/teachers/` | Public | List + filter by name, age_range, subject |
| GET | `/teachers/{id}/` | Public | Full profile + teaching history + avg ratings |
| GET | `/subjects/` | Public | List + filter by category |
| GET | `/subjects/{id}/` | Public | Detail + teacher list + difficulty stats |
| GET | `/course-instances/{id}/` | Public | Full detail: grades, weekly plan, syllabus history, reviews |
| GET | `/course-instances/compare/` | Public | `?ids=1,2` — side-by-side comparison data |
| POST | `/reviews/` | Auth | Create review for a course instance |
| POST | `/reviews/{id}/report/` | Auth | Report a review |
| POST | `/reviews/{id}/vote/` | Auth | Vote helpful/not helpful |
| GET | `/materials/` | Public | Approved materials for a subject `?subject_id=X` |
| POST | `/materials/` | Auth | Submit material for approval |
| GET | `/admin/moderation/materials/` | Admin | Pending materials queue |
| POST | `/admin/moderation/materials/{id}/` | Admin | Approve or reject |
| GET | `/admin/moderation/reports/` | Admin | Open reports queue |
| POST | `/admin/mass-assign-syllabus/` | Admin | Link one PDF to multiple CourseInstances |
| GET | `/admin/stats/` | Admin | Platform-wide stats for dashboard |

**Serializers**: Use `depth=1` or nested serializers for related objects. Use `SerializerMethodField` for computed properties like `average_ratings`.

---

### 1.3 Admin Panel Customization (`admin.py`)

```python
# Custom Admin Actions
@admin.action(description="Approve selected materials")
def approve_materials(modeladmin, request, queryset):
    queryset.update(status='approved')

# Admin classes to register with custom display
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ['author', 'course_instance', 'rating', 'is_hidden', 'report_count']
    list_filter   = ['is_hidden', 'created_at']
    actions       = ['hide_reviews']
    
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'status', 'contributor', 'created_at']
    list_filter  = ['status', 'type']
    actions      = [approve_materials]
```

---

### 1.4 Management Commands

#### `fill_demo_data.py`
Generate and seed:
- **50+ Teachers** with realistic Kazakhstani names (Nabiev, Shaimerdenova, Bekova, Akhmetov, etc.)
- **25+ Subjects** (Algorithms, OOP, Networks, Web Dev, Linear Algebra, etc.) with categories
- **CourseInstances** linking teachers to subjects with year intervals
- **Randomized grade distributions** (bell-curve shape: more B/B+, few A and F)
- **50+ Reviews** with varied text and ratings
- **Study materials** (approved status)

#### `scrape_university.py` (placeholder)
```python
# Placeholder for future use
# Intended to scrape teacher names and subject titles from kbtu.kz
# Use BeautifulSoup4 for static HTML or Playwright for dynamic pages
```

---

## PART 2: FRONTEND (Angular)

### 2.1 Routing (`app.routes.ts`)

```typescript
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'teachers', component: TeacherListComponent },
  { path: 'teachers/:id', component: TeacherProfileComponent },
  { path: 'subjects', component: SubjectListComponent },
  { path: 'subjects/:id', component: SubjectDetailComponent },
  { path: 'course/:id', component: CourseDetailComponent },
  { path: 'compare', component: CompareComponent },    // ?ids=1,2
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverviewComponent },
      { path: 'materials', component: MaterialModerationComponent },
      { path: 'reports', component: ReportModerationComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
```

---

### 2.2 Page-by-Page UI Specifications

#### `/` — Home Page
- **Hero section**: Large search bar (searches teachers AND subjects simultaneously)
- **Top Teachers** carousel (cards with photo, name, avg rating stars)
- **Trending Subjects** grid (cards with title, category badge, difficulty bar)
- **Stats counter**: X teachers, Y subjects, Z reviews
- **How it works** section (3 steps: Search → Compare → Choose)

#### `/teachers` — Teacher List
- **Left sidebar filters**:
  - Search by name (RxJS debounceTime 300ms)
  - Filter by age range (checkboxes)
  - Filter by department/subject
  - Sort by: Rating | Name | Most reviewed
- **Main area**: Responsive grid of `TeacherCard` components
  - Shows: photo, name, age range, top 3 taught subjects, overall rating (colored badge)
  - Hover: shows a small radar chart preview

#### `/teachers/:id` — Teacher Profile Page
- **Header**: Large photo, name, age range, verified badge, overall rating
- **Admin description block**: Styled blockquote
- **Teaching History Timeline**: Visual horizontal timeline with year intervals and subject names, color-coded by role (Lecturer/Practice/Labs)
- **Rating Radar Chart**: Chart.js radar — axes: Clarity, Objectivity, Accessibility, Workload
- **Sensitive Markers Section** (conditional): 
  - Only renders if `gender_bias_score > 3.0` AND confirmed by 10+ reviewers
  - Displayed with `opacity: 0.6` and a subtle warning icon
  - Located in a collapsible "Other Markers" section at the bottom
- **Subjects taught**: List of subject cards. Each shows difficulty for this specific teacher.
- **Reviews section**: Sorted by helpful votes. Shows `"Verified student"` badge if `took_this_course=true`.

#### `/subjects` — Subject List
- **Filter tabs**: All / Mandatory / Elective / Major / Minor
- **Search bar** (RxJS)
- **Subject cards**: Title, category badge, credits, overall difficulty meter (colored bar)

#### `/subjects/:id` — Subject Detail Page
- **Header**: Title, category, credits, admin description
- **Global Difficulty Block**:
  - `hard_level`: Horizontal progress bar (e.g., "Difficulty: 7.2/10")
  - `teacher_dependency_ratio`: Second bar (e.g., "Depends on teacher: High")
  - Explanation tooltip: "High dependency means difficulty varies a lot between teachers"
- **Teachers for this subject**: Sortable table/cards
  - Columns: Teacher Name | Avg Difficulty | Avg Rating | Grade Avg | Actions
  - Click → navigates to `/course/:id` for that specific teacher-subject combo
- **Approved Study Materials**: List with download/link button, type badge, contributor karma
- **Submit Material Button** (Auth only): Opens a modal form

#### `/course/:id` — Course Instance Detail (most complex page)
- **Breadcrumb**: Subjects → [Subject Name] → [Teacher Name]
- **Overview panel**: Teacher photo + Subject title + Year interval + Role
- **Grading Policy block**: Text description of how grades are calculated
- **Grade Distribution Chart**: Chart.js Bar Chart — X-axis: A, A-, B+, B, B-, C+, C, C-, D+, D, F, FX | Y-axis: Number of students
- **Weekly Plan accordion**: Collapsible list — Week 1: Topic / Activity type / Notes
- **Syllabus History**: Table — Year | Download PDF | Uploaded by
- **Compare Button**: "Compare with another teacher for this subject" — navigates to `/compare?ids=X,Y`
- **Reviews Section**:
  - Sorted by: Most helpful / Most recent
  - Each review card shows: rating, text, difficulty rating, anonymous badge or username, `took_this_course` badge, report button, helpful vote button
  - "Write a Review" button (Auth only) — expands inline form with: text, 5 rating sliders, anonymous checkbox, "I took this course" checkbox, sensitive markers (collapsible advanced section)

#### `/compare` — Comparison Page
- Side-by-side layout for 2 teachers on the same subject
- **Compared items**: Avg rating, difficulty, grade distribution (two charts side by side), radar charts overlaid on one canvas, grading policy, reviews count

#### `/admin-dashboard` — Admin Panel
- **Overview tab**: 
  - Stats cards: New reviews today, Pending materials, Open reports, Total users
  - Activity line chart (last 7 days)
- **Material Moderation tab**:
  - Table: Title | Subject | Type | Contributor | Date | Status
  - Quick action buttons per row: ✅ Approve | ❌ Reject
  - Bulk select + "Approve All Selected" button
- **Report Moderation tab**:
  - Table: Review excerpt | Reporter | Reason | Date | Report count
  - Actions: Hide Review | Dismiss Report | Ban User
- **Mass Syllabus Upload tab**:
  - Step 1: Select a Subject from dropdown
  - Step 2: Multi-select teachers who teach this subject (checkbox list)
  - Step 3: Upload PDF + enter year
  - Step 4: Submit → backend creates/updates SyllabusVersion for all selected CourseInstances

---

### 2.3 Services (`core/services/`)

```typescript
// All services use Angular HttpClient with JWT interceptor
TeacherService       // getAll(), getById(), getAverageRatings()
SubjectService       // getAll(), getById(), getDifficultyStats()
CourseService        // getById(), compare(ids: number[])
ReviewService        // create(), vote(), report()
MaterialService      // getApproved(), submit()
AuthService          // login(), register(), logout(), isLoggedIn(), isAdmin()
AdminService         // getModerationQueue(), approve(), reject(), getStats()
```

### 2.4 Guards & Interceptors

```typescript
// core/guards/auth.guard.ts — redirects to /login if not authenticated
// core/guards/admin.guard.ts — redirects to / if not admin
// core/interceptors/jwt.interceptor.ts — adds Authorization: Bearer {token} to all requests
// core/interceptors/error.interceptor.ts — handles 401 (auto-logout), 500 (show snackbar)
```

### 2.5 Shared Components

```
SharedModule/
├── NavbarComponent         — global search, auth buttons, dark mode toggle
├── FooterComponent
├── TeacherCardComponent    — reusable teacher preview card
├── SubjectCardComponent    — reusable subject preview card
├── RatingBadgeComponent    — colored badge (green 8+, yellow 5-7, red <5)
├── DifficultyBarComponent  — progress bar with color coding
├── GradeChartComponent     — Chart.js bar chart for grade distribution (reusable)
├── RadarChartComponent     — Chart.js radar for teacher traits (reusable)
├── LoadingSpinnerComponent
└── ConfirmDialogComponent
```

---

## PART 3: DARK MODE

Implement dark mode using Angular Material's theming:
- Toggle button in the navbar (🌙 / ☀️)
- Store preference in `localStorage`
- Apply `dark-theme` CSS class to `<body>`
- Both light and dark themes defined in `_themes.scss`

---

## PART 4: SECURITY & VALIDATION

- **Email validation**: Registration only accepts `@kbtu.kz` domain (backend + frontend validation)
- **File size limit**: Syllabi max 10MB, materials max 50MB
- **URL validation**: StudyMaterial links validated via Django's `URLValidator`
- **Auto-hide reviews**: Signal or `post_save` hook — if `Report.objects.filter(review=r).count() >= 5`, set `review.is_hidden = True`
- **CORS**: Allow only `http://localhost:4200` in development
- **Auth required**: POST/PUT/DELETE routes protected; GET routes public

---

## PART 5: DEMO DATA REQUIREMENTS

The `fill_demo_data.py` command must generate:

| Entity | Count | Notes |
|--------|-------|-------|
| Teachers | 60 | Kazakhstani names, varied age ranges, photos via placeholder service |
| Subjects | 30 | Mix of categories, realistic credit counts |
| CourseInstances | 80 | Multiple teachers per subject, realistic year intervals |
| Reviews | 150 | Varied ratings, some anonymous, some with sensitive markers |
| StudyMaterials | 40 | All approved, mix of types |
| Students | 20 | For authoring reviews |

Grade distribution shape: Approximate a realistic curve:
- F: 3–8%, D: 5–10%, C range: 15–20%, B range: 30–35%, A range: 20–30%
- Some "strict" teachers: skew toward C/D; some "easy" teachers: skew toward A/B

---

## IMPLEMENTATION ORDER (Phases)

**Phase 1 — Backend Foundation**
1. Django project setup with PostgreSQL connection
2. All models with migrations
3. Custom User model with email validation
4. DRF serializers for all models
5. All API endpoints

**Phase 2 — Admin & Data**
6. Django Admin customization (custom actions, list displays)
7. `fill_demo_data.py` management command
8. Test all endpoints via Django shell or Postman

**Phase 3 — Angular Core**
9. Angular project setup with routing
10. Auth flow (login/register/JWT interceptor/guards)
11. TeacherList and TeacherProfile pages
12. SubjectList and SubjectDetail pages

**Phase 4 — Complex Features**
13. CourseDetail page with all charts
14. Review submission flow
15. Compare page
16. Dark mode

**Phase 5 — Admin Dashboard**
17. Admin Dashboard all tabs
18. Moderation queue with quick actions
19. Mass Syllabus Upload tool

---

## HOW TO USE THIS PROMPT

### With Claude Code (Terminal):
```bash
# Save this file as spec.md in your project root, then:
claude "Read spec.md and start Phase 1: set up the Django project with PostgreSQL, create all models from the spec, run migrations, and confirm the structure."
```

### With Claude.ai (Web / Project):
Paste this entire document into **Project Instructions**, then send:
> *"Start with Phase 1. Create the Django project structure, all models exactly as specified, and DRF serializers. Show me `models.py` for each app first."*

After each phase is complete, continue:
> *"Phase 1 is done. Move to Phase 2: customize Django Admin and write the fill_demo_data.py management command."*

---

*Stack: Angular 17+ | Django 4.2+ | PostgreSQL | DRF | JWT | Chart.js | Angular Material*
