import { db } from '../db/db.js';

// Default VTU / Atria Scheme V Semester Course subjects (2-IA Scheme)
export const DEFAULT_COURSES = [
  { code: 'BAINB501', name: 'Artificial Intelligence Concepts & Practice', credits: 4, ia1: 38, ia2: 44, assignment: 18 },
  { code: 'BCNSB502', name: 'Computer Networks & Security', credits: 4, ia1: 35, ia2: 41, assignment: 17 },
  { code: 'BIDAB503', name: 'Intelligent Data Analytics', credits: 4, ia1: 44, ia2: 46, assignment: 19 },
  { code: 'BSTQAB515', name: 'Software Testing & Quality Assurance', credits: 3, ia1: 42, ia2: 44, assignment: 19 },
  { code: 'BRMIK504', name: 'Research Methodology and IPR', credits: 2, ia1: 40, ia2: 44, assignment: 18 },
  { code: 'BEFMK506', name: 'Economics & Financial Management', credits: 3, ia1: 36, ia2: 40, assignment: 16 },
  { code: 'BRALB507', name: 'React and Node JS Lab', credits: 2, ia1: 48, ia2: 50, assignment: 20 }
];

export const DEFAULT_PAST_SEMESTERS = [
  { semester: 'Sem 1', sgpa: 8.20, credits: 20 },
  { semester: 'Sem 2', sgpa: 8.45, credits: 20 },
  { semester: 'Sem 3', sgpa: 8.60, credits: 22 },
  { semester: 'Sem 4', sgpa: 8.52, credits: 22 }
];

export async function getGpaProfile(req, res) {
  try {
    const existing = db.findOne('gpaProfiles', { userId: req.user._id });

    const courses = existing?.courses || DEFAULT_COURSES;
    const pastSemesters = existing?.pastSemesters || DEFAULT_PAST_SEMESTERS;
    const targetGpa = existing?.targetGpa || 8.75;

    const analysis = calculatePredictions(courses, pastSemesters, targetGpa);

    res.json({
      courses,
      pastSemesters,
      targetGpa,
      analysis
    });
  } catch (err) {
    console.error('[GPA] Get profile error:', err);
    res.status(500).json({ message: 'Failed to load academic marks and GPA profile.' });
  }
}

export async function saveGpaProfile(req, res) {
  try {
    const { courses, pastSemesters, targetGpa } = req.body;
    if (!Array.isArray(courses)) {
      return res.status(400).json({ message: 'Courses array is required.' });
    }

    const payload = {
      userId: req.user._id,
      courses,
      pastSemesters: pastSemesters || DEFAULT_PAST_SEMESTERS,
      targetGpa: Number(targetGpa) || 8.5
    };

    const existing = db.findOne('gpaProfiles', { userId: req.user._id });
    if (existing) {
      db.updateById('gpaProfiles', existing._id, payload);
    } else {
      db.insertOne('gpaProfiles', payload);
    }

    const analysis = calculatePredictions(payload.courses, payload.pastSemesters, payload.targetGpa);

    res.json({
      message: 'Academic marks & GPA predictions updated!',
      analysis
    });
  } catch (err) {
    console.error('[GPA] Save error:', err);
    res.status(500).json({ message: 'Failed to save GPA profile.' });
  }
}

function calculatePredictions(courses, pastSemesters, targetGpa = 8.5) {
  let totalCurrentCredits = 0;
  let weightedPointsSum = 0;

  const subjectPredictions = courses.map(course => {
    const credits = Number(course.credits) || 3;
    totalCurrentCredits += credits;

    // EXACT ATRIA 2-IA FORMULA:
    // Average of (IA1 + IA2) scaled to 30 marks + Assignment (out of 20) = Internal 50
    const ia1 = Number(course.ia1 !== undefined ? course.ia1 : course.cie1) || 0;
    const ia2 = Number(course.ia2 !== undefined ? course.ia2 : course.cie2) || 0;
    const iaAvg = (ia1 + ia2) / 2; // Average of both IAs out of 50
    const scaledTestMarks = (iaAvg / 50) * 30; // Scaled to 30 marks
    const assignmentMarks = Math.min(Number(course.assignment) || 0, 20); // 20 marks

    // Total Internal (CIE) out of 50 marks
    const totalCie = Number((scaledTestMarks + assignmentMarks).toFixed(1));

    // Target Grades calculation (Total course score out of 100 = CIE 50 + SEE 50):
    // Grade O (90+ marks) -> Need (90 - totalCie) in SEE (out of 50)
    // Grade A+ (80+ marks) -> Need (80 - totalCie) in SEE
    // Grade A (70+ marks) -> Need (70 - totalCie) in SEE
    // Grade B+ (60+ marks) -> Need (60 - totalCie) in SEE
    // Passing min SEE is 18/50 (36%)
    const calculateNeededSee = (targetScore) => {
      const needed = targetScore - totalCie;
      if (needed > 50) return { marks: null, possible: false, message: 'Unachievable with current CIE' };
      if (needed <= 18) return { marks: 18, possible: true, message: 'Pass cutoff (18/50)' };
      return { marks: Math.ceil(needed), possible: true, message: `${Math.ceil(needed)}/50 needed in finals` };
    };

    // Realistic projected SEE based on internal performance
    const projectedSee = Math.min(Math.max(Math.round(totalCie * 0.88), 28), 48);
    const finalProjectedTotal = Math.min(totalCie + projectedSee, 100);

    let projectedGradePoint = 10;
    let gradeLabel = 'O';
    if (finalProjectedTotal < 40) { projectedGradePoint = 0; gradeLabel = 'F'; }
    else if (finalProjectedTotal < 50) { projectedGradePoint = 5; gradeLabel = 'C'; }
    else if (finalProjectedTotal < 60) { projectedGradePoint = 6; gradeLabel = 'B'; }
    else if (finalProjectedTotal < 70) { projectedGradePoint = 7; gradeLabel = 'B+'; }
    else if (finalProjectedTotal < 80) { projectedGradePoint = 8; gradeLabel = 'A'; }
    else if (finalProjectedTotal < 90) { projectedGradePoint = 9; gradeLabel = 'A+'; }

    weightedPointsSum += projectedGradePoint * credits;

    return {
      code: course.code,
      name: course.name,
      credits,
      ia1,
      ia2,
      iaAvg: Number(iaAvg.toFixed(1)),
      assignmentMarks,
      totalCie,
      projectedSee,
      finalProjectedTotal,
      projectedGradePoint,
      gradeLabel,
      seeRequirement: {
        gradeO: calculateNeededSee(90),
        gradeAplus: calculateNeededSee(80),
        gradeA: calculateNeededSee(70)
      }
    };
  });

  const predictedSgpa = totalCurrentCredits > 0
    ? Number((weightedPointsSum / totalCurrentCredits).toFixed(2))
    : 0;

  // Calculate Cumulative CGPA from Past Semesters
  let totalPastCredits = 0;
  let totalPastWeighted = 0;

  pastSemesters.forEach(sem => {
    const cr = Number(sem.credits) || 20;
    const sg = Number(sem.sgpa) || 8.0;
    totalPastCredits += cr;
    totalPastWeighted += cr * sg;
  });

  const previousCgpa = totalPastCredits > 0
    ? Number((totalPastWeighted / totalPastCredits).toFixed(2))
    : predictedSgpa;

  const totalOverallCredits = totalPastCredits + totalCurrentCredits;
  const predictedCgpa = totalOverallCredits > 0
    ? Number(((totalPastWeighted + weightedPointsSum) / totalOverallCredits).toFixed(2))
    : predictedSgpa;

  return {
    totalCredits: totalCurrentCredits,
    predictedSgpa,
    previousCgpa,
    predictedCgpa,
    cgpaChange: Number((predictedCgpa - previousCgpa).toFixed(2)),
    subjects: subjectPredictions,
    semestersTrend: [
      ...pastSemesters.map(s => ({ name: s.semester, gpa: Number(s.sgpa) || 8.0, credits: s.credits, isPredicted: false })),
      { name: 'Sem 5 (Pred)', gpa: predictedSgpa, isPredicted: true }
    ]
  };
}
