import bcrypt from 'bcrypt';
import { AdminStatus, StudentStatus } from '../types/enums';
import { AdminUser, Student, School, Class, AccessCode, ContentProgress, Content, Topic, Chapter, Subject } from '../models';
import { Op } from 'sequelize';
import { ERROR_CODES, DEFAULT_PAGE_SIZE } from '../constants';
import { PaginatedResult } from '../types';

// ----------------------------------------------------
// ADMIN USER MANAGEMENT
// ----------------------------------------------------

export async function listAdminUsers() {
  return AdminUser.findAll({
    attributes: ['id', 'name', 'email', 'status', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
  });
}

export async function getAdminUserById(id: number) {
  const admin = await AdminUser.findByPk(id, {
    attributes: ['id', 'name', 'email', 'status', 'createdAt', 'updatedAt'],
  });

  if (!admin) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Admin user not found',
    };
  }

  return admin;
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  status?: AdminStatus;
}) {
  const existing = await AdminUser.findOne({
    where: { email: data.email.trim().toLowerCase() },
  });

  if (existing) {
    throw {
      statusCode: 409,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'An admin with this email already exists',
    };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const newAdmin = await AdminUser.create({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash,
    status: data.status || AdminStatus.ACTIVE,
  });

  return {
    id: newAdmin.id,
    name: newAdmin.name,
    email: newAdmin.email,
    status: newAdmin.status,
    createdAt: newAdmin.createdAt,
  };
}

export async function updateAdminUser(
  id: number,
  data: { name?: string; email?: string; password?: string; status?: AdminStatus }
) {
  const admin = await AdminUser.findByPk(id);
  if (!admin) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Admin user not found',
    };
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.email) updateData.email = data.email.trim().toLowerCase();
  if (data.status) updateData.status = data.status;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  await admin.update(updateData);

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    status: admin.status,
    updatedAt: admin.updatedAt,
  };
}

export async function updateAdminUserStatus(id: number, status: AdminStatus) {
  const admin = await AdminUser.findByPk(id);
  if (!admin) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Admin user not found',
    };
  }

  await admin.update({ status });

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    status: admin.status,
  };
}

// ----------------------------------------------------
// ADMIN STUDENT MANAGEMENT
// ----------------------------------------------------

export async function listStudents(params: {
  page?: number;
  limit?: number;
  search?: string;
  schoolId?: number;
  classId?: number;
  status?: StudentStatus;
}): Promise<PaginatedResult<any>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${params.search}%` } },
      { email: { [Op.like]: `%${params.search}%` } },
      { phone: { [Op.like]: `%${params.search}%` } },
    ];
  }

  if (params.schoolId) where.schoolId = params.schoolId;
  if (params.classId) where.classId = params.classId;
  if (params.status) where.status = params.status;

  const { count: total, rows: items } = await Student.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
    include: [
      { model: School, as: 'school', attributes: ['id', 'name', 'schoolCode'] },
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade'] },
      { model: AccessCode, as: 'accessCode', attributes: ['id', 'code', 'status', 'usedAt'] },
      { model: ContentProgress, as: 'progress', attributes: ['id'] },
    ],
  });

  const totalPages = Math.ceil(total / limit);

  return {
    items: items.map((student: any) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      school: student.school,
      class: student.class,
      assignedAccessCode: student.accessCode ? student.accessCode.code : null,
      accessCodeStatus: student.accessCode ? student.accessCode.status : null,
      registrationDate: student.createdAt,
      lastLogin: student.lastLoginAt,
      completedActivities: student.progress ? student.progress.length : 0,
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

export async function getStudentById(id: number) {
  const student = await Student.findByPk(id, {
    include: [
      { model: School, as: 'school' },
      { model: Class, as: 'class' },
      { model: AccessCode, as: 'accessCode' },
      {
        model: ContentProgress,
        as: 'progress',
        limit: 10,
        order: [['lastAccessedAt', 'DESC']],
        include: [
          {
            model: Content,
            as: 'content',
            attributes: ['id', 'title', 'type'],
            include: [
              {
                model: Topic,
                as: 'topic',
                attributes: ['name'],
                include: [
                  {
                    model: Chapter,
                    as: 'chapter',
                    attributes: ['name'],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!student) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.STUDENT_NOT_FOUND,
      message: 'Student not found',
    };
  }

  return student;
}

export async function updateStudentStatus(id: number, status: StudentStatus) {
  const student = await Student.findByPk(id);
  if (!student) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.STUDENT_NOT_FOUND,
      message: 'Student not found',
    };
  }

  await student.update({ status });
  await student.reload({
    include: [
      { model: School, as: 'school', attributes: ['id', 'name'] },
      { model: Class, as: 'class', attributes: ['id', 'name'] },
    ],
  });

  return student;
}
