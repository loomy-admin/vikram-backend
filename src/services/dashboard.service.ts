import { AccessCodeStatus, StudentStatus } from '../types/enums';
import { School, Student, AccessCode, Class, Subject, Content } from '../models';

/**
 * Computes system-wide aggregated statistics for admin dashboard.
 */
export async function getDashboardStats() {
  const [
    totalSchools,
    totalStudents,
    activeStudents,
    pendingStudents,
    totalAccessCodes,
    usedCodes,
    unusedCodes,
    inactiveCodes,
    totalClasses,
    totalSubjects,
    totalContents,
  ] = await Promise.all([
    School.count(),
    Student.count(),
    Student.count({ where: { status: StudentStatus.ACTIVE } }),
    Student.count({ where: { status: StudentStatus.PENDING } }),
    AccessCode.count(),
    AccessCode.count({ where: { status: AccessCodeStatus.USED } }),
    AccessCode.count({ where: { status: AccessCodeStatus.UNUSED } }),
    AccessCode.count({ where: { status: AccessCodeStatus.INACTIVE } }),
    Class.count(),
    Subject.count(),
    Content.count(),
  ]);

  return {
    totalSchools,
    totalStudents,
    totalAccessCodes,
    usedCodes,
    unusedCodes,
    inactiveCodes,
    activeStudents,
    pendingStudents,
    totalClasses,
    totalSubjects,
    totalContents,
  };
}
