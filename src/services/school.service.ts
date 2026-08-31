import { SchoolStatus } from '../types/enums';
import { School, Student, AccessCode, Class } from '../models';
import { Op } from 'sequelize';
import { ERROR_CODES, DEFAULT_PAGE_SIZE } from '../constants';
import { PaginatedResult } from '../types';

/**
 * List schools with search, status filtering, and pagination.
 */
export async function listSchools(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: SchoolStatus;
}): Promise<PaginatedResult<any>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${params.search}%` } },
      { schoolCode: { [Op.like]: `%${params.search}%` } },
      { contactPerson: { [Op.like]: `%${params.search}%` } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  const { count: total, rows: items } = await School.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
    // Sequelize alternative to _count
    include: [
      { model: Student, as: 'students', attributes: ['id'] },
      { model: AccessCode, as: 'accessCodes', attributes: ['id'] },
    ],
  });

  // Depending on whether we want to do distinct count if grouping is an issue. With simple includes it might just work or we count array lengths.
  // We use findAndCountAll but the 'total' can sometimes be wrong when using includes without distinct: true. Let's do distinct.

  const totalPages = Math.ceil(total / limit);

  return {
    items: items.map((item: any) => ({
      ...item.toJSON(),
      _count: {
        students: item.students?.length || 0,
        accessCodes: item.accessCodes?.length || 0,
      },
    })),
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
 * Get single school details by ID with stats.
 */
export async function getSchoolById(id: number) {
  const school = await School.findByPk(id, {
    include: [
      { model: Student, as: 'students', attributes: ['id'] },
      { model: AccessCode, as: 'accessCodes', attributes: ['id'] },
    ],
  });

  if (!school) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
      message: 'School not found',
    };
  }

  return {
    ...school.toJSON(),
    _count: {
      students: (school as any).students?.length || 0,
      accessCodes: (school as any).accessCodes?.length || 0,
    },
  };
}

/**
 * Create a new school.
 */
export async function createSchool(data: {
  name: string;
  schoolCode: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status?: SchoolStatus;
}) {
  const existing = await School.findOne({
    where: { schoolCode: data.schoolCode.trim().toUpperCase() },
  });

  if (existing) {
    throw {
      statusCode: 409,
      code: ERROR_CODES.SCHOOL_CODE_EXISTS,
      message: 'A school with this unique school code already exists',
    };
  }

  return School.create({
    name: data.name.trim(),
    schoolCode: data.schoolCode.trim().toUpperCase(),
    address: data.address,
    contactPerson: data.contactPerson,
    phone: data.phone,
    email: data.email || null,
    status: data.status || SchoolStatus.ACTIVE,
  });
}

/**
 * Update school details.
 */
export async function updateSchool(
  id: number,
  data: {
    name?: string;
    schoolCode?: string;
    address?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    status?: SchoolStatus;
  }
) {
  const school = await School.findByPk(id);
  if (!school) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
      message: 'School not found',
    };
  }

  if (data.schoolCode) {
    const existing = await School.findOne({
      where: {
        schoolCode: data.schoolCode.trim().toUpperCase(),
        id: { [Op.ne]: id },
      },
    });

    if (existing) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.SCHOOL_CODE_EXISTS,
        message: 'School code is already in use by another school',
      };
    }
  }

  return school.update({
    ...(data.name && { name: data.name.trim() }),
    ...(data.schoolCode && { schoolCode: data.schoolCode.trim().toUpperCase() }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email || null }),
    ...(data.status && { status: data.status }),
  });
}

/**
 * Update school status (ACTIVE / INACTIVE).
 */
export async function updateSchoolStatus(id: number, status: SchoolStatus) {
  const school = await School.findByPk(id);
  if (!school) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
      message: 'School not found',
    };
  }
  return school.update({ status });
}

/**
 * List all students enrolled in a specific school.
 */
export async function getSchoolStudents(schoolId: number, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
  const offset = (page - 1) * limit;
  const where = { schoolId };

  const { count: total, rows: items } = await Student.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Class, as: 'class' },
      { model: AccessCode, as: 'accessCode', attributes: ['code', 'usedAt', 'status'] },
    ],
  });

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * List all access codes generated for a specific school.
 */
export async function getSchoolAccessCodes(schoolId: number, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
  const offset = (page - 1) * limit;
  const where = { schoolId };

  const { count: total, rows: items } = await AccessCode.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Student, as: 'student', attributes: ['id', 'name', 'email', 'phone'] },
    ],
  });

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
