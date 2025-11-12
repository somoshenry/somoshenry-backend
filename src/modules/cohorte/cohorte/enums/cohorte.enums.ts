export enum CohorteStatusEnum {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  UPCOMING = 'UPCOMING',
  CANCELLED = 'CANCELLED',
}

export enum CohorteModalityEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
}

export enum CohorteRoleEnum {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  TA = 'TA',
}

export enum MemberStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  DROPPED = 'DROPPED',
}

export enum ClassStatusEnum {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export enum AttendanceTypeEnum {
  STAND_UP = 'STAND_UP', // lo marca TA
  HANDS_ON = 'HANDS_ON', // lo marca TEACHER
}
