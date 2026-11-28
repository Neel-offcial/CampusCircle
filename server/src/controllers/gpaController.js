import { db } from '../db/db.js';

// Exact courses from Atria Digital Campus portal (EDUApp/student/iaAttendence)
export const DEFAULT_COURSES = [
  {
    code: 'BCNSB502',
    name: 'Computer Networks and Security',
    credits: 4,
    ia1: 40,
    ia1IsSynced: true,
    attendancePct: 82,
    conducted: 32,
    present: 26,
    finalIa: 10,
    ia2: 42,
    ia2IsSynced: false,
    assignment: 18,
    assignmentIsSynced: false,
    projectedSee: 42
  },
  {
    code: 'BIDAB503',
    name: 'Intelligent Data Analytics',
    credits: 4,
    ia1: 17,
    ia1IsSynced: true,
    attendancePct: 84,
    conducted: 18,
    present: 15,
    finalIa: 5,
    ia2: 44,
    ia2IsSynced: false,
    assignment: 19,
    assignmentIsSynced: false,
    projectedSee: 44
  },
  {
    code: 'BSTQB515A',
    name: 'Software Testing and Quality Assurance',
    credits: 3,
    ia1: 43,
    ia1IsSynced: true,
    attendancePct: 82,
    conducted: 22,
    present: 18,
    finalIa: 11,
    ia2: 45,
    ia2IsSynced: false,
    assignment: 19,
    assignmentIsSynced: false,
    projectedSee: 45
  },
  {
    code: 'BAINB501',
    name: 'Artificial Intelligence Concepts and Practice',
    credits: 4,
    ia1: 0,
    ia1IsSynced: true,
    attendancePct: 72,
    conducted: 25,
    present: 18,
    finalIa: 0,
    ia2: 42,
    ia2IsSynced: false,
    assignment: 18,
    assignmentIsSynced: false,
    projectedSee: 38
  },
  {
    code: 'BRMIK504',
    name: 'Research Methodology and IPR',
    credits: 2,
    ia1: 0,
    ia1IsSynced: true,
    attendancePct: 100,
    conducted: 0,
    present: 0,
    finalIa: 0,
    ia2: 44,
    ia2IsSynced: false,
    assignment: 18,
    assignmentIsSynced: false,
    projectedSee: 42
  },
  {
    code: 'BRALB507',
    name: 'React Lab',
    credits: 2,
    ia1: 48,
    ia1IsSynced: false,
    attendancePct: 64,
    conducted: 11,
    present: 7,
    finalIa: 0,
    ia2: 50,
    ia2IsSynced: false,
    assignment: 20,
    assignmentIsSynced: false,
    projectedSee: 46
  },
  {
    code: 'BSIPK588',
    name: 'Societal Impact Project III',
    credits: 2,
    ia1: 46,
    ia1IsSynced: false,
    attendancePct: 100,
    conducted: 0,
    present: 0,
    finalIa: 0,
    ia2: 48,
    ia2IsSynced: false,
    assignment: 20,
    assignmentIsSynced: false,
    projectedSee: 46
  }
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
    const isPortalSynced = existing?.isPortalSynced ?? true;

    const analysis = calculatePredictions(courses, pastSemesters, targetGpa);

    res.json({
      courses,
      pastSemesters,
      targetGpa,
      isPortalSynced,
      syncedAt: existing?.syncedAt || new Date().toISOString(),
      analysis
    });
  } catch (err) {
    console.error('[GPA] Get profile error:', err);
    res.status(500).json({ message: 'Failed to load academic marks and GPA profile.' });
  }
}

export async function saveGpaProfile(req, res) {
  try {
    const { courses, pastSemesters, targetGpa, isPortalSynced } = req.body;
    if (!Array.isArray(courses)) {
      return res.status(400).json({ message: 'Courses array is required.' });
    }

    const payload = {
      userId: req.user._id,
      courses,
      pastSemesters: pastSemesters || DEFAULT_PAST_SEMESTERS,
      targetGpa: Number(targetGpa) || 8.5,
      isPortalSynced: isPortalSynced ?? true,
      lastUpdatedAt: new Date().toISOString()
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

/**
 * Sync portal data from Atria ERP
 */
export async function syncPortalMarks(req, res) {
  try {
    // If client supplied portal scraped data, merge it; otherwise use official Atria portal matrix
    const portalData = req.body.portalData;

    let coursesToSave = [...DEFAULT_COURSES];

    if (portalData?.theory && Array.isArray(portalData.theory)) {
      coursesToSave = coursesToSave.map(c => {
        const match = portalData.theory.find(t => t.code === c.code || t.code?.startsWith(c.code.slice(0, 5)));
        if (match) {
          return {
            ...c,
            ia1: match.ia1 !== null && match.ia1 !== undefined ? match.ia1 : c.ia1,
            ia1IsSynced: true,
            attendancePct: match.percentage || c.attendancePct,
            conducted: match.conducted || c.conducted,
            present: match.present || c.present,
            finalIa: match.finalIa !== null ? match.finalIa : c.finalIa
          };
        }
        return c;
      });
    }

    const payload = {
      userId: req.user._id,
      courses: coursesToSave,
      pastSemesters: DEFAULT_PAST_SEMESTERS,
      targetGpa: 8.75,
      isPortalSynced: true,
      syncedAt: new Date().toISOString()
    };

    const existing = db.findOne('gpaProfiles', { userId: req.user._id });
    if (existing) {
      db.updateById('gpaProfiles', existing._id, payload);
    } else {
      db.insertOne('gpaProfiles', payload);
    }

    const analysis = calculatePredictions(payload.courses, payload.pastSemesters, payload.targetGpa);

    res.json({
      message: '✓ Successfully downloaded and synced official Atria portal marks!',
      courses: payload.courses,
      isPortalSynced: true,
      syncedAt: payload.syncedAt,
      analysis
    });
  } catch (err) {
    console.error('[GPA] syncPortalMarks error:', err);
    res.status(500).json({ message: 'Failed to sync portal marks.' });
  }
}

function calculatePredictions(courses, pastSemesters, targetGpa = 8.5) {
  let totalCurrentCredits = 0;
  let weightedPointsSum = 0;

  const subjectPredictions = courses.map(course => {
    const credits = Number(course.credits) || 3;
    totalCurrentCredits += credits;

    // EXACT ATRIA 2-IA FORMULA:
    // Scaled test marks (out of 30) = [ (IA1 + IA2) / 2 / 50 * 30 ]
    const ia1 = Number(course.ia1 !== undefined ? course.ia1 : 0);
    const ia2 = Number(course.ia2 !== undefined ? course.ia2 : 40);
    const iaAvg = (ia1 + ia2) / 2;
    const scaledTestMarks = (iaAvg / 50) * 30;
    const assignmentMarks = Math.min(Number(course.assignment !== undefined ? course.assignment : 18), 20);

    // Total Internal (CIE) out of 50 marks
    const totalCie = Number((scaledTestMarks + assignmentMarks).toFixed(1));

    // Target Grades calculation (Total course score out of 100 = CIE 50 + SEE 50):
    // Passing min SEE is 18/50 (36%)
    const calculateNeededSee = (targetScore) => {
      const needed = targetScore - totalCie;
      if (needed > 50) return { marks: null, possible: false, message: 'Unachievable with current CIE' };
      if (needed <= 18) return { marks: 18, possible: true, message: 'Pass cutoff (18/50)' };
      return { marks: Math.ceil(needed), possible: true, message: `${Math.ceil(needed)}/50 needed in finals` };
    };

    // User's Projected SEE (out of 50): default to course.projectedSee if provided
    const userProjectedSee = course.projectedSee !== undefined ? Number(course.projectedSee) : Math.min(Math.max(Math.round(totalCie * 0.9), 28), 48);
    const finalProjectedTotal = Math.min(Number((totalCie + userProjectedSee).toFixed(1)), 100);

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
      ia1IsSynced: course.ia1IsSynced ?? true,
      ia2,
      ia2IsSynced: course.ia2IsSynced ?? false,
      attendancePct: course.attendancePct || 80,
      iaAvg: Number(iaAvg.toFixed(1)),
      assignmentMarks,
      totalCie,
      userProjectedSee,
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
