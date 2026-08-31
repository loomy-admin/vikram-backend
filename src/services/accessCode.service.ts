import { AccessCodeStatus, StudentStatus, SchoolStatus } from '../types/enums';
import { AccessCode, Student, School } from '../models';
import { generate10DigitCode, generateBulk10DigitCodes } from '../utils/codeGenerator';
import { ERROR_CODES, DEFAULT_PAGE_SIZE } from '../constants';
import { PaginatedResult } from '../types';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';

/**
 * Activates an account using a 10-digit access code.
 * Runs atomically inside a database transaction to prevent concurrent reuse.
 */
export async function activateStudentWithCode(studentId: number, rawCode: string) {
  const code = rawCode.trim();

  if (!/^[0-9]{10}$/.test(code)) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.ACCESS_CODE_INVALID,
      message: 'Access code must be exactly 10 numeric digits',
    };
  }

  // Execute atomic transaction
  return await sequelize.transaction(async (tx) => {
    // 1. Fetch student
    const student = await Student.findByPk(studentId, { transaction: tx });

    if (!student) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.STUDENT_NOT_FOUND,
        message: 'Student account not found',
      };
    }

    // Check if student is already active
    if (student.status === StudentStatus.ACTIVE) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'This student account has already been activated.',
      };
    }

    // 2. Fetch access code
    const accessCodeRecord = await AccessCode.findOne({
      where: { code },
      include: [{ model: School, as: 'school' }],
      transaction: tx,
    });

    if (!accessCodeRecord) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.ACCESS_CODE_INVALID,
        message: 'The access code entered is invalid. Please check and try again.',
      };
    }

    const school = (accessCodeRecord as any).school;

    // Check if the school is active
    if (school.status !== SchoolStatus.ACTIVE) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'The school associated with this access code is currently inactive.',
      };
    }

    // Check if student's school matches the code's school
    if (student.schoolId && student.schoolId !== accessCodeRecord.schoolId) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'This access code is not assigned to your registered school.',
      };
    }

    // Check if code is inactive
    if (accessCodeRecord.status === AccessCodeStatus.INACTIVE) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.ACCESS_CODE_INACTIVE,
        message: 'This access code is currently inactive. Please contact your school administrator.',
      };
    }

    // Check if code has already been used
    if (accessCodeRecord.status === AccessCodeStatus.USED || accessCodeRecord.studentId) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.ACCESS_CODE_ALREADY_USED,
        message: 'This access code has already been activated by another student.',
      };
    }

    // 3. Mark access code as USED and link to student
    const now = new Date();
    const updatedCode = await accessCodeRecord.update({
      status: AccessCodeStatus.USED,
      studentId: student.id,
      usedAt: now,
    }, { transaction: tx });

    // 4. Activate student account
    await student.update({
      status: StudentStatus.ACTIVE,
      schoolId: accessCodeRecord.schoolId,
    }, { transaction: tx });

    // Reload with associations
    await student.reload({
      include: ['school', 'class'],
      transaction: tx,
    });

    logger.info(`Student ID ${student.id} (${student.name}) successfully activated with code: ${code}`);

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        status: student.status,
        school: (student as any).school,
        class: (student as any).class,
      },
      accessCode: {
        code: updatedCode.code,
        status: updatedCode.status,
        usedAt: updatedCode.usedAt,
      },
    };
  });
}

/**
 * Admin: Generate a single unique 10-digit access code for a school.
 */
export async function generateSingleCode(schoolId: number) {
  const school = await School.findByPk(schoolId);

  if (!school) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
      message: 'Target school not found',
    };
  }

  let code = generate10DigitCode();
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const existing = await AccessCode.findOne({ where: { code } });
    if (!existing) {
      isUnique = true;
    } else {
      code = generate10DigitCode();
      attempts++;
    }
  }

  if (!isUnique) {
    throw {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Failed to generate unique 10-digit code. Please retry.',
    };
  }

  const accessCode = await AccessCode.create({
    code,
    schoolId,
    status: AccessCodeStatus.UNUSED,
  });

  await accessCode.reload({ include: ['school'] });

  logger.info(`Generated single 10-digit access code ${code} for school ID ${schoolId}`);

  return accessCode;
}

/**
 * Admin: Generate bulk unique 10-digit access codes for a school.
 */
export async function generateBulkCodes(schoolId: number, quantity: number) {
  const school = await School.findByPk(schoolId);

  if (!school) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
      message: 'Target school not found',
    };
  }

  // Fetch existing codes to prevent collision in memory
  const existingCodes = await AccessCode.findAll({
    attributes: ['code'],
  });
  const existingSet = new Set<string>(existingCodes.map((c: any) => c.code));

  const generatedCodes = generateBulk10DigitCodes(quantity, existingSet);

  // Insert records in batch
  await AccessCode.bulkCreate(
    generatedCodes.map((code) => ({
      code,
      schoolId,
      status: AccessCodeStatus.UNUSED,
    })),
    { ignoreDuplicates: true }
  );

  logger.info(`Generated ${generatedCodes.length} bulk access codes for school ID ${schoolId}`);

  const nowIso = new Date().toISOString();
  const codesList = generatedCodes.map((code, index) => ({
    id: index + 1,
    code,
    status: AccessCodeStatus.UNUSED,
    createdAt: nowIso,
  }));

  return {
    schoolId,
    schoolName: school.name,
    totalGenerated: generatedCodes.length,
    sampleCodes: generatedCodes.slice(0, 5),
    codes: codesList,
  };
}

/**
 * Admin: List access codes with filters and pagination.
 */
export async function listAccessCodes(params: {
  page?: number;
  limit?: number;
  search?: string;
  schoolId?: number;
  status?: AccessCodeStatus;
  isUsed?: boolean;
}): Promise<PaginatedResult<any>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    where.code = { [Op.like]: `%${params.search.trim()}%` };
  }

  if (params.schoolId) {
    where.schoolId = params.schoolId;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.isUsed !== undefined) {
    where.status = params.isUsed ? AccessCodeStatus.USED : AccessCodeStatus.UNUSED;
  }

  const { count: total, rows: items } = await AccessCode.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
    include: [
      { model: School, as: 'school', attributes: ['id', 'name', 'schoolCode'] },
      { model: Student, as: 'student', attributes: ['id', 'name', 'email', 'phone', 'status'] },
    ],
  });

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Admin: Get access code details by ID.
 */
export async function getAccessCodeById(id: number) {
  const code = await AccessCode.findByPk(id, {
    include: [
      { model: School, as: 'school', attributes: ['id', 'name', 'schoolCode', 'contactPerson', 'phone'] },
      { model: Student, as: 'student', attributes: ['id', 'name', 'email', 'phone', 'status', 'classId'] },
    ],
  });

  if (!code) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.ACCESS_CODE_NOT_FOUND,
      message: 'Access code not found',
    };
  }

  return code;
}

/**
 * Admin: Update access code status (e.g. UNUSED <-> INACTIVE).
 */
export async function updateAccessCodeStatus(id: number, status: AccessCodeStatus) {
  const code = await AccessCode.findByPk(id);

  if (!code) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.ACCESS_CODE_NOT_FOUND,
      message: 'Access code not found',
    };
  }

  if (code.status === AccessCodeStatus.USED && status !== AccessCodeStatus.USED) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Cannot modify status of an already used access code',
    };
  }

  await code.update({ status });
  await code.reload({ include: [{ model: School, as: 'school', attributes: ['id', 'name'] }] });

  return code;
}

/**
 * Admin: Reassign an UNUSED access code to another school.
 */
export async function reassignAccessCode(id: number, targetSchoolId: number) {
  const code = await AccessCode.findByPk(id);

  if (!code) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.ACCESS_CODE_NOT_FOUND,
      message: 'Access code not found',
    };
  }

  if (code.status === AccessCodeStatus.USED) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.ACCESS_CODE_CANNOT_REASSIGN_USED,
      message: 'Cannot reassign a code that has already been used by a student',
    };
  }

  const school = await School.findByPk(targetSchoolId);
  if (!school) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
      message: 'Target school not found',
    };
  }

  await code.update({ schoolId: targetSchoolId });
  await code.reload({ include: [{ model: School, as: 'school', attributes: ['id', 'name', 'schoolCode'] }] });

  return code;
}
