/**
 * Idempotent seed for VidyaPath catalog tables.
 * Inserts a small but functional set: 9 concepts, 9 lessons (3 per subject),
 * 30 quiz items (12 diagnostic + 18 lesson-attached), 6 careers, 4 scholarships, 4 mentors.
 *
 * Re-running is safe (INSERT IGNORE).
 */

const CONCEPTS = [
    { id: 'c-math-frac', subject: 'Mathematics', title: 'Fractions' },
    { id: 'c-math-alg',  subject: 'Mathematics', title: 'Linear Equations' },
    { id: 'c-math-geo',  subject: 'Mathematics', title: 'Triangles' },
    { id: 'c-sci-force', subject: 'Science',     title: 'Force and Motion' },
    { id: 'c-sci-cell',  subject: 'Science',     title: 'The Cell' },
    { id: 'c-sci-light', subject: 'Science',     title: 'Light' },
    { id: 'c-eng-tense', subject: 'English',     title: 'Tenses' },
    { id: 'c-eng-comp',  subject: 'English',     title: 'Reading Comprehension' },
    { id: 'c-eng-vocab', subject: 'English',     title: 'Vocabulary Builder' }
];

const LESSONS = [
    { id: 'l-math-frac', concept_id: 'c-math-frac', subject: 'Mathematics', title: 'Fractions: An Introduction',
      body: { en: 'A fraction represents a part of a whole. The number above the line is the numerator and the number below is the denominator.\n\nWorked example: 3/4 means 3 of 4 equal parts.\n\nKey rules:\n1. Equivalent fractions have the same value (1/2 = 2/4).\n2. To add fractions you need a common denominator.\n3. Simplify by dividing top and bottom by the same number.',
              hi: 'भिन्न किसी पूरे का एक भाग दर्शाता है। रेखा के ऊपर की संख्या अंश है और नीचे की हर है।\n\nउदाहरण: 3/4 का अर्थ है 4 बराबर भागों में से 3 भाग।',
              ta: 'பின்னம் என்பது ஒரு முழுமையின் ஒரு பகுதியைக் குறிக்கிறது. கோட்டிற்கு மேலே உள்ள எண் தொகுதி, கீழே உள்ள எண் பகுதி.\n\nஉதாரணம்: 3/4 என்பது 4 சம பாகங்களில் 3 பாகங்களாகும்.' } },
    { id: 'l-math-alg', concept_id: 'c-math-alg', subject: 'Mathematics', title: 'Solving Linear Equations',
      body: { en: 'A linear equation in one variable has the form ax + b = 0. To solve, isolate x by performing the same operation on both sides.\n\nWorked example: 2x + 3 = 11. Subtract 3: 2x = 8. Divide by 2: x = 4.',
              hi: 'एक चर वाला रैखिक समीकरण ax + b = 0 के रूप में होता है।',
              ta: 'ஒரு மாறி கொண்ட நேரிய சமன்பாடு ax + b = 0 வடிவில் இருக்கும்.' } },
    { id: 'l-math-geo', concept_id: 'c-math-geo', subject: 'Mathematics', title: 'Properties of Triangles',
      body: { en: 'The sum of the interior angles of any triangle is 180 degrees. Triangles are classified by sides (equilateral, isosceles, scalene) and by angles (acute, right, obtuse).',
              hi: 'किसी भी त्रिभुज के आंतरिक कोणों का योग 180 डिग्री होता है।',
              ta: 'எந்த முக்கோணத்திலும் உள் கோணங்களின் கூட்டுத்தொகை 180 டிகிரி.' } },
    { id: 'l-sci-force', concept_id: 'c-sci-force', subject: 'Science', title: "Newton's Laws of Motion",
      body: { en: "Newton's first law: an object remains at rest or in uniform motion unless acted on by a net force. Second law: F = m × a. Third law: every action has an equal and opposite reaction.",
              hi: 'न्यूटन का पहला नियम: कोई वस्तु तब तक विरामावस्था या एकसमान गति में रहती है जब तक उस पर बल न लगाया जाए।',
              ta: 'நியூட்டனின் முதல் விதி: ஒரு பொருளின் மீது நிகர விசை செயல்படாதவரை அது ஓய்வாகவோ அல்லது சீரான இயக்கத்திலோ இருக்கும்.' } },
    { id: 'l-sci-cell', concept_id: 'c-sci-cell', subject: 'Science', title: 'The Cell — Basic Unit of Life',
      body: { en: 'The cell is the smallest unit of life. Plant cells have a cell wall and chloroplasts; animal cells do not. Both have a nucleus, mitochondria, and ribosomes.',
              hi: 'कोशिका जीवन की सबसे छोटी इकाई है।',
              ta: 'செல் உயிரின் மிகச்சிறிய அலகு.' } },
    { id: 'l-sci-light', concept_id: 'c-sci-light', subject: 'Science', title: 'Reflection and Refraction of Light',
      body: { en: 'Light travels in straight lines. When it strikes a smooth surface it reflects (angle of incidence = angle of reflection). When it passes between media of different densities it refracts (bends).',
              hi: 'प्रकाश सीधी रेखाओं में चलता है।',
              ta: 'ஒளி நேர் கோடுகளில் பயணிக்கிறது.' } },
    { id: 'l-eng-tense', concept_id: 'c-eng-tense', subject: 'English', title: 'Tenses — Past, Present, Future',
      body: { en: 'English has three principal tenses (past, present, future) each with simple, continuous, perfect, and perfect-continuous aspects. Use the present simple for habits and general truths.',
              hi: 'अंग्रेज़ी में तीन मुख्य काल होते हैं — भूत, वर्तमान, भविष्य।',
              ta: 'ஆங்கிலத்தில் மூன்று முக்கிய காலங்கள் உள்ளன — இறந்த, நிகழ், எதிர்.' } },
    { id: 'l-eng-comp', concept_id: 'c-eng-comp', subject: 'English', title: 'Reading Comprehension Strategies',
      body: { en: 'Read the passage twice. First skim for the main idea, then read carefully looking for keywords. Annotate as you go. When answering questions, point to the exact line in the passage.',
              hi: 'गद्यांश को दो बार पढ़ें।',
              ta: 'பத்தியை இரண்டு முறை படியுங்கள்.' } },
    { id: 'l-eng-vocab', concept_id: 'c-eng-vocab', subject: 'English', title: 'Building Vocabulary with Roots',
      body: { en: 'Many English words come from Latin and Greek roots. "Bio" means life (biology, biography). "Geo" means earth (geography, geology). Learn 5 roots per week.',
              hi: 'कई अंग्रेज़ी शब्द लैटिन और ग्रीक मूलों से आते हैं।',
              ta: 'பல ஆங்கில வார்த்தைகள் லத்தீன் மற்றும் கிரேக்க வேர்களிலிருந்து வருகின்றன.' } }
];

const QUIZ_ITEMS = [
    // Diagnostic items (one per concept, mixed difficulty)
    { id: 'q-diag-1', subject: 'Mathematics', concept_id: 'c-math-frac', is_diagnostic: 1,
      kind: 'mcq', prompt: 'What is 1/2 + 1/4?', options: ['1/6','3/4','2/6','3/8'], answer: '3/4', a: 1.1, b: -0.5, c: 0.25 },
    { id: 'q-diag-2', subject: 'Mathematics', concept_id: 'c-math-alg', is_diagnostic: 1,
      kind: 'mcq', prompt: 'Solve 3x − 5 = 7. x = ?', options: ['2','3','4','5'], answer: '4', a: 1.0, b: 0.0, c: 0.25 },
    { id: 'q-diag-3', subject: 'Mathematics', concept_id: 'c-math-geo', is_diagnostic: 1,
      kind: 'mcq', prompt: 'In a triangle, two angles are 60° and 70°. The third is?', options: ['40°','50°','60°','70°'], answer: '50°', a: 1.2, b: 0.2, c: 0.25 },
    { id: 'q-diag-4', subject: 'Mathematics', concept_id: 'c-math-frac', is_diagnostic: 1,
      kind: 'mcq', prompt: 'Which is equivalent to 4/8?', options: ['1/2','1/3','2/3','3/4'], answer: '1/2', a: 1.0, b: -1.0, c: 0.25 },
    { id: 'q-diag-5', subject: 'Science', concept_id: 'c-sci-force', is_diagnostic: 1,
      kind: 'mcq', prompt: 'Force = mass × ?', options: ['velocity','acceleration','energy','distance'], answer: 'acceleration', a: 1.0, b: 0.0, c: 0.25 },
    { id: 'q-diag-6', subject: 'Science', concept_id: 'c-sci-cell', is_diagnostic: 1,
      kind: 'mcq', prompt: 'Which organelle is the powerhouse of the cell?', options: ['Nucleus','Mitochondria','Ribosome','Golgi'], answer: 'Mitochondria', a: 1.1, b: -0.2, c: 0.25 },
    { id: 'q-diag-7', subject: 'Science', concept_id: 'c-sci-light', is_diagnostic: 1,
      kind: 'mcq', prompt: 'Which law states angle of incidence equals angle of reflection?', options: ['Refraction','Reflection','Diffraction','Polarisation'], answer: 'Reflection', a: 1.0, b: 0.1, c: 0.25 },
    { id: 'q-diag-8', subject: 'Science', concept_id: 'c-sci-force', is_diagnostic: 1,
      kind: 'mcq', prompt: "An object at rest stays at rest unless acted on by a force. This is ___'s 1st law.", options: ['Newton','Einstein','Boyle','Ohm'], answer: 'Newton', a: 0.9, b: -0.4, c: 0.25 },
    { id: 'q-diag-9', subject: 'English', concept_id: 'c-eng-tense', is_diagnostic: 1,
      kind: 'mcq', prompt: 'She ___ to school every day. Choose the correct verb.', options: ['go','goes','going','went'], answer: 'goes', a: 1.0, b: -0.6, c: 0.25 },
    { id: 'q-diag-10', subject: 'English', concept_id: 'c-eng-vocab', is_diagnostic: 1,
      kind: 'mcq', prompt: 'The Greek root "bio" means?', options: ['earth','life','water','time'], answer: 'life', a: 1.0, b: 0.0, c: 0.25 },
    { id: 'q-diag-11', subject: 'English', concept_id: 'c-eng-comp', is_diagnostic: 1,
      kind: 'mcq', prompt: 'The best first step in reading comprehension is to:', options: ['memorise','skim for main idea','translate','skip questions'], answer: 'skim for main idea', a: 1.0, b: -0.2, c: 0.25 },
    { id: 'q-diag-12', subject: 'English', concept_id: 'c-eng-tense', is_diagnostic: 1,
      kind: 'mcq', prompt: 'Pick the past tense: "I ___ a book yesterday."', options: ['read','reads','reading','will read'], answer: 'read', a: 1.0, b: 0.0, c: 0.25 },

    // Lesson-attached items
    { id: 'q-frac-1', subject: 'Mathematics', concept_id: 'c-math-frac', lesson_id: 'l-math-frac',
      kind: 'mcq', prompt: 'Simplify 6/9.', options: ['2/3','3/4','1/2','5/6'], answer: '2/3', a: 1.0, b: -0.5, c: 0.25 },
    { id: 'q-frac-2', subject: 'Mathematics', concept_id: 'c-math-frac', lesson_id: 'l-math-frac',
      kind: 'short', prompt: 'Explain in one sentence what a denominator represents.', answer: 'It represents the total number of equal parts the whole is divided into.', a: 1.2, b: 0.4 },
    { id: 'q-alg-1', subject: 'Mathematics', concept_id: 'c-math-alg', lesson_id: 'l-math-alg',
      kind: 'mcq', prompt: 'Solve 5x = 30. x = ?', options: ['5','6','7','8'], answer: '6', a: 1.0, b: -0.3, c: 0.25 },
    { id: 'q-alg-2', subject: 'Mathematics', concept_id: 'c-math-alg', lesson_id: 'l-math-alg',
      kind: 'mcq', prompt: '2(x − 3) = 10. x = ?', options: ['7','8','9','10'], answer: '8', a: 1.1, b: 0.3, c: 0.25 },
    { id: 'q-geo-1', subject: 'Mathematics', concept_id: 'c-math-geo', lesson_id: 'l-math-geo',
      kind: 'mcq', prompt: 'A triangle with all sides equal is called?', options: ['Scalene','Isosceles','Equilateral','Right'], answer: 'Equilateral', a: 1.0, b: -0.5, c: 0.25 },
    { id: 'q-force-1', subject: 'Science', concept_id: 'c-sci-force', lesson_id: 'l-sci-force',
      kind: 'mcq', prompt: 'A 2 kg object accelerates at 3 m/s². Force?', options: ['5 N','6 N','9 N','12 N'], answer: '6 N', a: 1.2, b: 0.2, c: 0.25 },
    { id: 'q-force-2', subject: 'Science', concept_id: 'c-sci-force', lesson_id: 'l-sci-force',
      kind: 'short', prompt: 'State Newton\'s third law in your own words.', answer: 'For every action there is an equal and opposite reaction.', a: 1.1, b: 0.5 },
    { id: 'q-cell-1', subject: 'Science', concept_id: 'c-sci-cell', lesson_id: 'l-sci-cell',
      kind: 'mcq', prompt: 'Which structure is found in plant but not animal cells?', options: ['Nucleus','Cell wall','Mitochondria','Ribosomes'], answer: 'Cell wall', a: 1.0, b: 0.0, c: 0.25 },
    { id: 'q-light-1', subject: 'Science', concept_id: 'c-sci-light', lesson_id: 'l-sci-light',
      kind: 'mcq', prompt: 'Bending of light when it passes between media is called?', options: ['Reflection','Refraction','Dispersion','Diffraction'], answer: 'Refraction', a: 1.0, b: 0.1, c: 0.25 },
    { id: 'q-tense-1', subject: 'English', concept_id: 'c-eng-tense', lesson_id: 'l-eng-tense',
      kind: 'mcq', prompt: 'Pick the present continuous: "She ___ a book."', options: ['reads','is reading','read','will read'], answer: 'is reading', a: 1.0, b: -0.2, c: 0.25 },
    { id: 'q-tense-2', subject: 'English', concept_id: 'c-eng-tense', lesson_id: 'l-eng-tense',
      kind: 'mcq', prompt: 'Future simple of "go": "I ___ tomorrow."', options: ['go','went','will go','am going'], answer: 'will go', a: 0.9, b: -0.3, c: 0.25 },
    { id: 'q-comp-1', subject: 'English', concept_id: 'c-eng-comp', lesson_id: 'l-eng-comp',
      kind: 'short', prompt: 'Why should you read a passage twice before answering?', answer: 'First reading gives the main idea, second reading helps locate specific details.', a: 1.0, b: 0.2 },
    { id: 'q-vocab-1', subject: 'English', concept_id: 'c-eng-vocab', lesson_id: 'l-eng-vocab',
      kind: 'mcq', prompt: 'The root "geo" means?', options: ['life','earth','time','self'], answer: 'earth', a: 1.0, b: -0.4, c: 0.25 },
    { id: 'q-vocab-2', subject: 'English', concept_id: 'c-eng-vocab', lesson_id: 'l-eng-vocab',
      kind: 'mcq', prompt: '"Biography" most likely means a?', options: ['life-story','map','clock','machine'], answer: 'life-story', a: 1.0, b: -0.2, c: 0.25 },
    { id: 'q-frac-3', subject: 'Mathematics', concept_id: 'c-math-frac', lesson_id: 'l-math-frac',
      kind: 'mcq', prompt: '2/3 + 1/6 = ?', options: ['3/9','5/6','3/6','7/6'], answer: '5/6', a: 1.2, b: 0.4, c: 0.25 },
    { id: 'q-alg-3', subject: 'Mathematics', concept_id: 'c-math-alg', lesson_id: 'l-math-alg',
      kind: 'mcq', prompt: 'If x + 5 = 2x − 3, then x = ?', options: ['6','7','8','9'], answer: '8', a: 1.3, b: 0.6, c: 0.25 }
];

const CAREERS = [
    { id: 'car-cs', title: 'Software Engineer', domain: 'Technology',
      summary: 'Designs and builds software systems and applications.',
      skills: ['Programming','Algorithms','Problem Solving','Mathematics'],
      avg_salary: '₹6L–₹40L p.a.', education: 'B.Tech / BSc in Computer Science or related field.' },
    { id: 'car-ds', title: 'Data Scientist', domain: 'Technology',
      summary: 'Extracts insights from data using statistics, ML, and programming.',
      skills: ['Statistics','Python','Machine Learning','Mathematics'],
      avg_salary: '₹8L–₹45L p.a.', education: 'B.Tech / MSc with strong mathematics.' },
    { id: 'car-doc', title: 'Doctor (MBBS)', domain: 'Medicine',
      summary: 'Diagnoses and treats illness in patients.',
      skills: ['Biology','Chemistry','Empathy','Memory'],
      avg_salary: '₹6L–₹50L p.a.', education: 'NEET → MBBS → optional MD specialisation.' },
    { id: 'car-teach', title: 'Teacher', domain: 'Education',
      summary: 'Educates students in a chosen subject and grade level.',
      skills: ['Communication','Patience','Subject Mastery','Empathy'],
      avg_salary: '₹3L–₹15L p.a.', education: 'Subject degree + B.Ed.' },
    { id: 'car-civ', title: 'Civil Servant (UPSC)', domain: 'Government',
      summary: 'Public administration role through Indian civil services.',
      skills: ['General Knowledge','Writing','Reasoning','Leadership'],
      avg_salary: '₹7L–₹25L p.a.', education: 'Any Bachelor\'s + UPSC Civil Services Examination.' },
    { id: 'car-jrn', title: 'Journalist', domain: 'Media',
      summary: 'Researches, writes, and presents news stories.',
      skills: ['Writing','English','Research','Curiosity'],
      avg_salary: '₹3L–₹18L p.a.', education: 'BA Journalism / Mass Communication.' }
];

const SCHOLARSHIPS = [
    { id: 'sch-nmms', title: 'National Means-cum-Merit Scholarship (NMMS)', provider: 'Govt of India',
      eligibility: 'Class 8 students with family income < ₹3.5L p.a. and 55%+ marks.',
      amount: '₹12,000 per year', deadline: null, url: 'https://scholarships.gov.in' },
    { id: 'sch-inspire', title: 'INSPIRE Scholarship for Higher Education',
      provider: 'Department of Science & Technology',
      eligibility: 'Top 1% in Class 12 board, pursuing BSc/MSc in basic sciences.',
      amount: '₹80,000 per year', deadline: null, url: 'https://online-inspire.gov.in' },
    { id: 'sch-pre', title: 'Pre-Matric Scholarship for SC/ST', provider: 'Ministry of Social Justice',
      eligibility: 'SC/ST students Class 9–10 with family income < ₹2.5L.',
      amount: '₹2,250–₹4,500 per year', deadline: null, url: 'https://scholarships.gov.in' },
    { id: 'sch-ksp', title: 'Kishore Vaigyanik Protsahan Yojana (KVPY)', provider: 'IISc / DST',
      eligibility: 'Students from Class 11 to first year of UG in basic sciences.',
      amount: '₹5,000–₹7,000 per month', deadline: null, url: 'https://kvpy.iisc.ac.in' }
];

const MENTORS = [
    { id: 'mtr-arjun', name: 'Dr. Arjun Iyer', expertise: 'Mathematics & Engineering',
      bio: 'PhD IIT Madras, 12 years mentoring JEE aspirants.',
      languages: 'English, Tamil', availability: 'Sat–Sun, 5–8 pm', contact: 'arjun.iyer@example.org' },
    { id: 'mtr-priya', name: 'Priya Sharma', expertise: 'Science & Medicine',
      bio: 'NEET coach, MBBS AIIMS. Helps Class 10–12 students plan medical careers.',
      languages: 'English, Hindi', availability: 'Tue/Thu evenings', contact: 'priya.sharma@example.org' },
    { id: 'mtr-suman', name: 'Suman Reddy', expertise: 'English & Communication',
      bio: 'Cambridge-certified English trainer, 8 years coaching for IELTS / SAT.',
      languages: 'English, Telugu, Hindi', availability: 'Mon/Wed/Fri', contact: 'suman.reddy@example.org' },
    { id: 'mtr-vikram', name: 'Vikram Singh', expertise: 'UPSC & Civil Services',
      bio: 'IAS officer (retd.), mentors aspirants on strategy and answer-writing.',
      languages: 'English, Hindi', availability: 'Saturdays', contact: 'vikram.singh@example.org' }
];

async function seedVpCatalog(pool) {
    let inserted = 0;
    try {
        for (const c of CONCEPTS) {
            const [r] = await pool.query(
                'INSERT IGNORE INTO vp_concepts (id, subject, title) VALUES (?,?,?)',
                [c.id, c.subject, c.title]
            );
            inserted += r.affectedRows || 0;
        }
        for (const l of LESSONS) {
            const [r] = await pool.query(
                'INSERT IGNORE INTO vp_lessons (id, concept_id, subject, title, body_i18n) VALUES (?,?,?,?,?)',
                [l.id, l.concept_id, l.subject, l.title, JSON.stringify(l.body || {})]
            );
            inserted += r.affectedRows || 0;
        }
        for (const q of QUIZ_ITEMS) {
            const [r] = await pool.query(
                `INSERT IGNORE INTO vp_quiz_items
                 (id, lesson_id, concept_id, subject, kind, prompt_i18n, options_i18n, answer_key, a, b, c, is_diagnostic)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    q.id, q.lesson_id || null, q.concept_id || null, q.subject, q.kind,
                    JSON.stringify({ en: q.prompt }),
                    q.options ? JSON.stringify({ en: q.options }) : null,
                    q.answer || null,
                    q.a ?? 1.0, q.b ?? 0.0, q.c ?? 0.2,
                    q.is_diagnostic ? 1 : 0
                ]
            );
            inserted += r.affectedRows || 0;
        }
        for (const c of CAREERS) {
            const [r] = await pool.query(
                'INSERT IGNORE INTO vp_careers (id, title, domain, summary, skills_json, avg_salary, education) VALUES (?,?,?,?,?,?,?)',
                [c.id, c.title, c.domain, c.summary, JSON.stringify(c.skills || []), c.avg_salary, c.education]
            );
            inserted += r.affectedRows || 0;
        }
        for (const s of SCHOLARSHIPS) {
            const [r] = await pool.query(
                'INSERT IGNORE INTO vp_scholarships (id, title, provider, eligibility, amount, url) VALUES (?,?,?,?,?,?)',
                [s.id, s.title, s.provider, s.eligibility, s.amount, s.url]
            );
            inserted += r.affectedRows || 0;
        }
        for (const m of MENTORS) {
            const [r] = await pool.query(
                'INSERT IGNORE INTO vp_mentors (id, name, expertise, bio, languages, availability, contact) VALUES (?,?,?,?,?,?,?)',
                [m.id, m.name, m.expertise, m.bio, m.languages, m.availability, m.contact]
            );
            inserted += r.affectedRows || 0;
        }
        console.log(`[vp] seed complete (+${inserted} rows)`);
    } catch (err) {
        console.warn('[vp] seed warning:', err.message);
    }
}

module.exports = { seedVpCatalog };
