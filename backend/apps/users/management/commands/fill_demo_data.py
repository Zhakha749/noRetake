"""
fill_demo_data.py — Seed KBTU Platform with realistic demo data.

Counts guaranteed:
  20 Students · 60 Teachers · 30 Subjects · 80 CourseInstances
  150 Reviews  · 40 StudyMaterials

Grade distribution follows the spec bell-curve:
  normal  → A: 20-30%  B: 30-35%  C: 15-20%  D: 5-10%  F: 3-8%
  easy    → A: 35-45%  B: 30-35%  C: 10-15%  D: 3-5%   F: 1-3%
  strict  → A: 5-10%   B: 20-25%  C: 25-30%  D: 15-20% F: 10-15%

Teacher "personality" is assigned once and drives both grade style
and expected rating range so the data feels internally consistent.
"""

import random
from django.core.management.base import BaseCommand
from django.db import transaction

# ── Static data ───────────────────────────────────────────────────────────────

TEACHER_NAMES = [
    # Kazakhstani names (60 total)
    "Nabiev Arman",          "Shaimerdenova Aizat",   "Bekova Gulnara",
    "Akhmetov Daniyar",      "Seitkali Zarina",        "Nurmagambetov Baurzhan",
    "Kassymova Aigerim",     "Dzhaksybekov Timur",     "Ospanova Saule",
    "Beisenov Ruslan",       "Alimova Madina",         "Temirbekov Almas",
    "Mukhanova Dinara",      "Suleimenov Erlan",       "Kenzhebekova Zhuldyz",
    "Askarov Marat",         "Tursynova Bibigul",      "Rakhimov Dauren",
    "Abilova Nazgul",        "Utegenov Serik",         "Dzhunusbekova Altyn",
    "Bekmukhambetov Azamat", "Sarsenova Assel",        "Karimov Ilyas",
    "Zhumabayeva Saltanat",  "Akhanov Danial",         "Kozhanova Karlygash",
    "Sultanov Yerlan",       "Bekturganova Ainur",     "Mamytbekov Kairat",
    "Abdrakhmanova Farida",  "Serikbayev Aslan",       "Dzhumanova Gaukhar",
    "Tulegenov Nurlan",      "Abenova Zulfiya",        "Issayev Bagdat",
    "Khairullina Venera",    "Muratov Alibek",         "Smagulova Nurgul",
    "Khassenov Olzhas",      "Yessenova Tamara",       "Bolatov Adil",
    "Dzhaksybekova Meruert", "Umarov Zhandos",         "Toktarova Raushan",
    "Azhikhanov Bauyrzhan",  "Kazhimuratova Moldir",  "Seydakhmet Samat",
    "Nurmakhanova Aliya",    "Berdibayev Meirambek",  "Zhaksylykova Elmira",
    "Omarov Dias",           "Bekzhanova Gulsanam",   "Sadykov Erzhan",
    "Kenzhebayeva Aigul",    "Tyurin Alexey",          "Bondarenko Irina",
    "Voronov Pavel",         "Petrova Natalya",        "Sokolov Dmitry",
]

# (title, category, credits, description)
SUBJECTS = [
    ("Algorithms and Data Structures",  "major",     5, "Covers algorithm design, complexity analysis, and core data structures including trees, graphs, heaps, and hash tables."),
    ("Object-Oriented Programming",     "major",     5, "Introduces OOP paradigms: encapsulation, inheritance, polymorphism, and design patterns in Java and C++."),
    ("Computer Networks",               "major",     4, "Study of network protocols, layered architecture, TCP/IP, routing, and network security fundamentals."),
    ("Web Development",                 "elective",  3, "Full-stack web development covering HTML/CSS, JavaScript, REST APIs, and modern frameworks."),
    ("Linear Algebra",                  "mandatory", 4, "Vector spaces, linear transformations, matrix factorizations, and applications in computer science."),
    ("Calculus I",                      "mandatory", 4, "Limits, derivatives, integration, and applications of single-variable calculus."),
    ("Calculus II",                     "mandatory", 4, "Techniques of integration, series, sequences, and multivariable calculus introduction."),
    ("Discrete Mathematics",            "mandatory", 4, "Logic, set theory, combinatorics, graph theory, and proof techniques."),
    ("Database Management Systems",     "major",     4, "Relational model, SQL, normalization, transaction management, and NoSQL overview."),
    ("Operating Systems",               "major",     4, "Process management, memory, file systems, concurrency, and OS security."),
    ("Software Engineering",            "major",     4, "SDLC, Agile, UML, testing methodologies, and large-scale system design."),
    ("Machine Learning",                "elective",  4, "Supervised and unsupervised learning, neural networks, model evaluation, and practical applications."),
    ("Artificial Intelligence",         "elective",  4, "Search algorithms, knowledge representation, planning, and intro to AI ethics."),
    ("Computer Architecture",           "major",     4, "ISA, pipelining, memory hierarchy, cache design, and parallel architectures."),
    ("Programming Fundamentals",        "mandatory", 5, "Introduction to programming using Python: control flow, functions, data structures, and OOP basics."),
    ("Data Science",                    "elective",  3, "Data wrangling, exploratory analysis, visualization, and intro to predictive modeling."),
    ("Mobile Application Development",  "elective",  3, "Android and iOS development using Kotlin and Swift, REST integration, and UI design."),
    ("Cloud Computing",                 "elective",  3, "Cloud models (IaaS/PaaS/SaaS), virtualization, containerization, and major cloud providers."),
    ("Cybersecurity Fundamentals",      "minor",     3, "Threat landscape, cryptography basics, network security, and ethical hacking introduction."),
    ("Project Management",              "minor",     3, "Agile and Waterfall methodologies, risk management, resource planning, and stakeholder communication."),
    ("Statistics and Probability",      "mandatory", 4, "Probability theory, random variables, distributions, hypothesis testing, and regression analysis."),
    ("Digital Circuits",                "major",     4, "Boolean algebra, logic gates, combinational and sequential circuits, and FPGA basics."),
    ("Theory of Computation",           "major",     4, "Automata theory, formal languages, Turing machines, decidability, and complexity classes."),
    ("Compiler Design",                 "profile",   4, "Lexical analysis, parsing, semantic analysis, intermediate code generation, and optimization."),
    ("Human-Computer Interaction",      "elective",  3, "Usability principles, user research methods, prototyping, and accessibility design."),
    ("Distributed Systems",             "profile",   4, "Consistency models, consensus algorithms, fault tolerance, and distributed data stores."),
    ("Blockchain Technology",           "elective",  3, "Distributed ledger fundamentals, smart contracts, consensus mechanisms, and DeFi overview."),
    ("Internet of Things",              "elective",  3, "Embedded systems, sensor networks, IoT protocols, data collection, and edge computing."),
    ("Natural Language Processing",     "profile",   4, "Text preprocessing, language models, transformers, and applications in search and generation."),
    ("Computer Vision",                 "profile",   4, "Image processing, feature extraction, CNNs, object detection, and segmentation."),
]

YEAR_INTERVALS = [
    "2019–2021", "2020–2022", "2021–2023", "2022–2024", "2023–2025", "2024–2026",
]
ROLES = ["Lecturer", "Practice", "Labs", "All"]

GRADING_POLICIES = [
    "Midterm: 30%, Final Exam: 40%, Assignments: 20%, Attendance: 10%",
    "Midterm: 25%, Final Exam: 35%, Projects: 30%, Quizzes: 10%",
    "Midterm: 35%, Final Exam: 45%, Labs: 20%",
    "Midterm: 20%, Final Exam: 30%, Coursework: 40%, Participation: 10%",
    "Midterm: 30%, Final Exam: 30%, Group Project: 30%, Quizzes: 10%",
    "Midterm: 25%, Final Exam: 40%, Lab Reports: 25%, Attendance: 10%",
    "Midterm: 40%, Final Exam: 40%, Homework: 20%",
]

# Teacher personality → (grade_style, rating_range, description_trait)
PERSONALITIES = [
    ('easy',   (7, 10), 'approachable and supportive teaching style'),
    ('normal', (5,  9), 'balanced approach combining theory and practice'),
    ('normal', (5,  9), 'clear explanations with well-structured course material'),
    ('strict', (4,  8), 'high academic standards and challenging assessments'),
    ('strict', (3,  7), 'demanding curriculum focused on deep conceptual understanding'),
]

DESCRIPTION_TEMPLATES = [
    "Professor {name} is known for {trait}. Students appreciate their commitment to academic excellence at KBTU.",
    "{name} brings extensive industry experience to the classroom, combining {trait} with real-world applications.",
    "A respected member of the KBTU faculty, {name} is recognized for {trait} and active research contributions.",
    "{name} has been teaching at KBTU for over a decade. Their courses are known for {trait}.",
    "With a PhD from a leading university, {name} is valued for {trait} and mentoring students toward careers in tech.",
]

REVIEW_TEXTS = {
    'easy': [
        "One of the most supportive professors I've had. Always available to help and genuinely wants students to succeed.",
        "Great teacher! Explains everything very clearly. The course is challenging but fair, and you always feel supported.",
        "Very approachable. Office hours are actually useful. Highly recommend if you're new to the subject.",
        "The course workload is reasonable and the grading is transparent. I learned a lot without feeling overwhelmed.",
        "Professor really cares about student progress. Gives helpful feedback and is patient with questions.",
        "I came in with zero background and left feeling confident. The pace is well-calibrated.",
        "Best professor for this subject at KBTU. Lectures are engaging and the assignments are practical.",
        "Clear expectations from day one. The grading policy is fair and the final project was a great learning experience.",
    ],
    'normal': [
        "Solid professor. Explains concepts clearly and the workload is manageable if you stay on top of it.",
        "Good course overall. Theory is balanced with practical assignments. Start projects early.",
        "The midterm was tough but fair. Attend all lectures and you'll do fine.",
        "Organized course material and a fair grading policy. Nothing exceptional but nothing disappointing either.",
        "I learned a lot. The professor uses real-world examples which makes the abstract content much clearer.",
        "Reasonable workload spread across the semester. Exams are challenging but reflect what was taught.",
        "Good balance of lectures and practice sessions. The course prepares you well for more advanced topics.",
        "Lectures are informative, sometimes a bit dry. But the content is solid and well worth taking.",
        "The professor is available for questions and gives detailed feedback on assignments. Very helpful.",
        "Course content is well-structured. Make sure you complete all the weekly tasks — they add up.",
    ],
    'strict': [
        "Very demanding professor. If you put in the effort the grade reflects it, but don't expect an easy ride.",
        "Tough course. Exams are hard and the grading is strict. Study consistently from week one.",
        "High expectations and challenging assignments. The learning is real, but so is the stress.",
        "Not the easiest professor, but one of the most knowledgeable. You will actually learn the material.",
        "Be prepared to work hard. The final exam is comprehensive and covers every lecture in detail.",
        "Strict grader but fair. If you understand the material you'll pass — understanding is the key word.",
        "The course separates those who study from those who don't. Challenging but rewarding.",
        "Lots of content compressed into one semester. Stay ahead of the reading or you'll fall behind fast.",
    ],
}

MATERIAL_TITLES = [
    "Lecture Notes – Weeks 1–7",   "Lecture Notes – Weeks 8–15",
    "Past Exam 2021 (with answers)","Past Exam 2022 (with answers)",
    "Past Exam 2023 (with answers)","Past Midterm 2022",
    "Past Midterm 2023",            "Textbook Chapter Solutions",
    "Lab Manual",                   "Cheat Sheet – Final",
    "Reference Handbook",          "Practice Problem Set",
    "Summary Notes",               "Formula Sheet",
    "Project Guidelines",          "Code Examples Repository",
    "Lecture Recordings Index",    "Sample Final Project",
]

WEEKLY_TOPICS = {
    "Algorithms and Data Structures": [
        "Introduction, Big-O Notation, Complexity Analysis",
        "Arrays, Dynamic Arrays, and Linked Lists",
        "Stacks, Queues, and Deques",
        "Recursion and Recursive Problem Solving",
        "Trees: Binary Trees and BST",
        "Balanced BST: AVL and Red-Black Trees",
        "Heaps and Priority Queues",
        "Hash Tables: Design and Collision Resolution",
        "Graphs: Representation (Adjacency List/Matrix)",
        "Graph Traversal: BFS and DFS",
        "Shortest Path: Dijkstra and Bellman-Ford",
        "Minimum Spanning Tree: Prim and Kruskal",
        "Sorting: Merge Sort, Quick Sort, Heap Sort",
        "Dynamic Programming I: Memoization",
        "Dynamic Programming II and Greedy Algorithms",
    ],
    "Object-Oriented Programming": [
        "Introduction to OOP, Classes and Objects",
        "Encapsulation and Access Modifiers",
        "Constructors, Destructors, and Memory",
        "Inheritance: Single and Multi-level",
        "Polymorphism and Method Overriding",
        "Interfaces and Abstract Classes",
        "Design Patterns: Creational",
        "Design Patterns: Structural",
        "Design Patterns: Behavioral",
        "Exception Handling",
        "Collections and Generics",
        "Concurrency and Threads",
        "Unit Testing and TDD",
        "SOLID Principles",
        "Refactoring and Code Smells",
    ],
    "Computer Networks": [
        "Network Models: OSI and TCP/IP",
        "Physical Layer: Transmission Media",
        "Data Link Layer: Framing and Error Detection",
        "MAC Protocols and Ethernet",
        "Network Layer: IP Addressing and Subnetting",
        "Routing Protocols: RIP, OSPF, BGP",
        "Transport Layer: TCP and UDP",
        "TCP Flow Control and Congestion Control",
        "DNS and DHCP",
        "HTTP and HTTPS",
        "Email Protocols: SMTP, IMAP, POP3",
        "Network Security: Firewalls and VPNs",
        "Wireless Networks: WiFi and Cellular",
        "Software-Defined Networking",
        "Network Troubleshooting and Tools",
    ],
    "Database Management Systems": [
        "Introduction to Databases and DBMS",
        "Entity-Relationship (ER) Modeling",
        "Relational Model and Relational Algebra",
        "SQL: DDL (CREATE, ALTER, DROP)",
        "SQL: DML (INSERT, UPDATE, DELETE, SELECT)",
        "SQL: Joins and Subqueries",
        "SQL: Aggregation and Window Functions",
        "Normalization: 1NF, 2NF, 3NF",
        "Normalization: BCNF and Beyond",
        "Indexing and Query Optimization",
        "Transactions and ACID Properties",
        "Concurrency Control: Locks and MVCC",
        "Recovery and Logging",
        "NoSQL Databases: Document and Key-Value",
        "Distributed Databases and CAP Theorem",
    ],
    "Machine Learning": [
        "Introduction to ML, Types of Learning",
        "Linear Regression and Gradient Descent",
        "Logistic Regression and Binary Classification",
        "Decision Trees and Random Forests",
        "Support Vector Machines",
        "K-Nearest Neighbours and Naive Bayes",
        "Feature Engineering and Selection",
        "Cross-Validation and Model Evaluation",
        "Unsupervised Learning: K-Means Clustering",
        "Unsupervised Learning: PCA and Dimensionality Reduction",
        "Neural Networks: Perceptrons and MLP",
        "Backpropagation and Optimization",
        "Convolutional Neural Networks Overview",
        "Recurrent Neural Networks Overview",
        "Model Deployment and ML Pipelines",
    ],
    "Operating Systems": [
        "Introduction to OS, History and Types",
        "Process Concept and Process States",
        "Process Scheduling Algorithms",
        "Threads and Concurrency",
        "Synchronization: Semaphores and Mutexes",
        "Deadlock Detection and Prevention",
        "Memory Management: Paging",
        "Memory Management: Segmentation",
        "Virtual Memory and Page Replacement",
        "File System Structures",
        "File System Implementation",
        "I/O Systems and Device Drivers",
        "Storage Management: RAID",
        "OS Security: Access Control",
        "Virtualization and Containers",
    ],
    "default": [
        "Introduction and Course Overview",
        "Foundational Concepts and Terminology",
        "Theoretical Models and Formal Frameworks",
        "Core Techniques Part I",
        "Core Techniques Part II",
        "Practical Lab: Applying Core Concepts",
        "Midterm Review",
        "Midterm Exam Week",
        "Advanced Topics Part I",
        "Advanced Topics Part II",
        "Case Studies from Industry",
        "Emerging Trends and Research Directions",
        "Project Workshop and Peer Review",
        "Student Presentations",
        "Review, Q&A, and Final Exam Preparation",
    ],
}


# ── Grade distribution ────────────────────────────────────────────────────────

# Grade order: A A- B+ B B- C+ C C- D+ D F FX
# Percentages correspond to: A-range, B-range, C-range, D-range, F-range

_GRADE_KEYS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'FX']

# Each tuple = (low_pct, high_pct) for that grade within its range bucket.
# Ranges are sampled first, then distributed within the range.
_RANGE_SPECS = {
    # style: [A_range%, B_range%, C_range%, D_range%, F_range%]
    'easy':   [(35, 45), (30, 35), (10, 15), (3,  5),  (1,  3)],
    'normal': [(20, 30), (30, 35), (15, 20), (5, 10),  (3,  8)],
    'strict': [(5,  10), (20, 25), (25, 30), (15, 20), (10, 15)],
}

# Sub-distribution inside each range bucket (A, A-)  (B+, B, B-)  (C+, C, C-)  (D+, D)  (F, FX)
_BUCKET_WEIGHTS = [
    [0.55, 0.45],            # A range:  A  A-
    [0.33, 0.40, 0.27],      # B range:  B+ B  B-
    [0.30, 0.40, 0.30],      # C range:  C+ C  C-
    [0.45, 0.55],            # D range:  D+ D
    [0.65, 0.35],            # F range:  F  FX
]


def make_grade_distribution(style='normal'):
    range_spec = _RANGE_SPECS[style]
    total = random.randint(28, 65)
    counts = []
    for (lo, hi), weights in zip(range_spec, _BUCKET_WEIGHTS):
        bucket_pct = random.uniform(lo, hi) / 100
        bucket_n = max(0, round(total * bucket_pct))
        # Distribute bucket among grades
        rem = bucket_n
        for j, w in enumerate(weights):
            if j == len(weights) - 1:
                counts.append(rem)
            else:
                n = round(bucket_n * w)
                counts.append(n)
                rem -= n
    return dict(zip(_GRADE_KEYS, [max(0, c) for c in counts]))


# ── Main command ──────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Seed the database with realistic demo data for KBTU Platform'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clear', action='store_true',
            help='Skip clearing existing data before seeding',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.users.models import Student
        from apps.teachers.models import Teacher
        from apps.subjects.models import Subject
        from apps.courses.models import CourseInstance
        from apps.reviews.models import Review
        from apps.materials.models import StudyMaterial

        if not options['no_clear']:
            self.stdout.write('Clearing existing data...')
            Review.objects.all().delete()
            StudyMaterial.objects.all().delete()
            CourseInstance.objects.all().delete()
            Subject.objects.all().delete()
            Teacher.objects.all().delete()
            Student.objects.filter(is_superuser=False).delete()

        # ── Students (20) ─────────────────────────────────────────────────────
        self.stdout.write('Creating 20 students...')
        students = []
        for i in range(1, 21):
            s = Student.objects.create_user(
                username=f'student{i:02d}',
                university_email=f'student{i:02d}@kbtu.kz',
                password='demo1234',
                is_verified=True,
            )
            students.append(s)
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(students)} students'))

        # ── Teachers (60) ─────────────────────────────────────────────────────
        self.stdout.write('Creating 60 teachers...')
        age_ranges = ['20-30', '30-40', '40-50', '50-60', '60+']
        # Weight toward realistic faculty ages
        age_weights = [0.05, 0.25, 0.35, 0.25, 0.10]

        teachers = []
        # Assign each teacher a personality deterministically so grade dist
        # and review ratings are internally consistent
        teacher_styles = {}   # teacher_obj → grade_style
        teacher_rating_range = {}  # teacher_obj → (lo, hi)

        for name in TEACHER_NAMES:
            personality = random.choices(PERSONALITIES, weights=[2, 3, 3, 2, 1])[0]
            grade_style, rating_range, trait = personality
            age = random.choices(age_ranges, weights=age_weights)[0]
            first_name = name.split()[1] if len(name.split()) > 1 else name
            description = random.choice(DESCRIPTION_TEMPLATES).format(
                name=name, trait=trait
            )
            teacher = Teacher.objects.create(
                full_name=name,
                description=description,
                age_range=age,
                is_verified=True,
                gender_bias_score=round(random.uniform(0.0, 2.0), 1)
                    if random.random() > 0.1 else round(random.uniform(3.0, 5.0), 1),
            )
            teacher_styles[teacher.id] = grade_style
            teacher_rating_range[teacher.id] = rating_range
            teachers.append(teacher)
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(teachers)} teachers'))

        # ── Subjects (30) ─────────────────────────────────────────────────────
        self.stdout.write('Creating 30 subjects...')
        subjects = []
        for title, category, credits, description in SUBJECTS:
            subject = Subject.objects.create(
                title=title,
                category=category,
                credits=credits,
                description=description,
            )
            subjects.append(subject)
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(subjects)} subjects'))

        # ── Course Instances (80, guaranteed) ─────────────────────────────────
        self.stdout.write('Creating 80 course instances...')

        # Strategy: assign each subject 2-3 teacher slots; then fill to 80.
        # This guarantees coverage across subjects, not just random clustering.
        course_instances = []
        used_keys = set()

        def _create_ci(teacher, subject):
            year = random.choice(YEAR_INTERVALS)
            role = random.choice(ROLES)
            key = (teacher.id, subject.id, year, role)
            if key in used_keys:
                return False
            used_keys.add(key)

            topics = WEEKLY_TOPICS.get(subject.title, WEEKLY_TOPICS['default'])
            weekly_plan = [
                {
                    'week': i + 1,
                    'topic': topics[i % len(topics)],
                    'type': random.choice(['lecture', 'practice', 'lab']),
                }
                for i in range(15)
            ]
            style = teacher_styles[teacher.id]
            ci = CourseInstance.objects.create(
                teacher=teacher,
                subject=subject,
                year_interval=year,
                role=role,
                grading_policy=random.choice(GRADING_POLICIES),
                weekly_plan=weekly_plan,
                grade_distribution=make_grade_distribution(style),
            )
            course_instances.append(ci)
            return True

        # Round 1: each subject gets ~2-3 teachers (covers all 30 subjects)
        shuffled_teachers = teachers[:]
        random.shuffle(shuffled_teachers)
        teacher_pool = shuffled_teachers * 3   # enough to go around
        t_idx = 0
        for subject in subjects:
            slots = random.randint(2, 3)
            for _ in range(slots):
                _create_ci(teacher_pool[t_idx % len(teacher_pool)], subject)
                t_idx += 1

        # Round 2: fill remaining slots to reach exactly 80
        attempts = 0
        while len(course_instances) < 80 and attempts < 2000:
            attempts += 1
            _create_ci(random.choice(teachers), random.choice(subjects))

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(course_instances)} course instances'))

        # ── Reviews (150, exactly) ─────────────────────────────────────────────
        self.stdout.write('Creating 150 reviews...')

        # Pre-bucket CIs by teacher style so we can draw realistic ratings
        ci_by_style = {'easy': [], 'normal': [], 'strict': []}
        for ci in course_instances:
            ci_by_style[teacher_styles[ci.teacher_id]].append(ci)

        reviews_created = 0
        target = 150
        # Distribute: ~25% easy, ~50% normal, ~25% strict
        ci_pool = (
            random.choices(ci_by_style['easy'],   k=round(target * 0.25)) +
            random.choices(ci_by_style['normal'],  k=round(target * 0.50)) +
            random.choices(ci_by_style['strict'],  k=round(target * 0.25))
        )
        random.shuffle(ci_pool)

        for i, ci in enumerate(ci_pool[:target]):
            style = teacher_styles[ci.teacher_id]
            lo, hi = teacher_rating_range[ci.teacher_id]

            rating      = random.randint(lo, hi)
            # Difficulty inversely correlates with style
            if style == 'easy':
                diff = random.randint(2, 6)
            elif style == 'strict':
                diff = random.randint(6, 10)
            else:
                diff = random.randint(4, 8)

            is_anon = random.random() < 0.60
            has_bias = random.random() < 0.08   # ~8% mark gender bias

            text_pool = REVIEW_TEXTS[style]
            Review.objects.create(
                author=random.choice(students),
                course_instance=ci,
                text=random.choice(text_pool),
                rating=rating,
                difficulty_rating=diff,
                clarity_rating=max(1, min(10, rating + random.randint(-1, 1))),
                objectivity_rating=max(1, min(10, rating + random.randint(-1, 1))),
                accessibility_rating=max(1, min(10, rating + random.randint(-2, 2))),
                workload_rating=max(1, min(10, diff + random.randint(-1, 1))),
                is_anonymous=is_anon,
                took_this_course=random.random() < 0.70,
                sensitive_markers={
                    'gender_bias': has_bias,
                    'favoritism': random.random() < 0.04,
                },
                helpful_votes=random.randint(0, 12),
            )
            reviews_created += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {reviews_created} reviews'))

        # ── Study Materials (40, all approved) ────────────────────────────────
        self.stdout.write('Creating 40 study materials...')
        mat_types = ['lecture', 'exam', 'book', 'other']
        type_weights = [0.35, 0.30, 0.20, 0.15]

        for _ in range(40):
            mat_type = random.choices(mat_types, weights=type_weights)[0]
            # Pick a title that roughly fits the type
            if mat_type == 'exam':
                title_pool = [t for t in MATERIAL_TITLES if 'Exam' in t or 'Midterm' in t or 'Past' in t]
            elif mat_type == 'lecture':
                title_pool = [t for t in MATERIAL_TITLES if 'Lecture' in t or 'Notes' in t or 'Summary' in t]
            else:
                title_pool = MATERIAL_TITLES
            contributor = random.choice(students)
            StudyMaterial.objects.create(
                title=random.choice(title_pool),
                link='',
                type=mat_type,
                status='approved',
                subject=random.choice(subjects),
                contributor=contributor,
            )
            # Award karma manually since status is set directly (no status change)
            contributor.karma += 5
            contributor.save(update_fields=['karma'])

        self.stdout.write(self.style.SUCCESS('  ✓ 40 study materials'))

        # ── Summary ───────────────────────────────────────────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 50))
        self.stdout.write(self.style.SUCCESS('  Demo data seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('═' * 50))
        self.stdout.write(f'  Students:         {Student.objects.filter(is_superuser=False).count()}')
        self.stdout.write(f'  Teachers:         {Teacher.objects.count()}')
        self.stdout.write(f'  Subjects:         {Subject.objects.count()}')
        self.stdout.write(f'  Course Instances: {CourseInstance.objects.count()}')
        self.stdout.write(f'  Reviews:          {Review.objects.count()}')
        self.stdout.write(f'  Study Materials:  {StudyMaterial.objects.count()}')
        self.stdout.write('')
        self.stdout.write('  Demo login:  student01@kbtu.kz  /  demo1234')
        self.stdout.write('  Admin:       python manage.py createsuperuser')
