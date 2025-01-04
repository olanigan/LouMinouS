/**
 * Core System Collections
 * These collections handle fundamental platform functionality
 */
import { Users } from './Users'
import { Media } from './Media'
import { Tenants } from './Tenants'
import { StudentSettings } from './StudentSettings'

/**
 * Learning Management Collections
 * These collections handle course content and student progress
 */
import { Courses } from './Courses'
import { Modules } from './Modules'
import { Lessons } from './Lessons'
import { Progress } from './Progress'
import { Enrollments } from './Enrollments'

/**
 * Gamification Collections
 * These collections handle points, rewards, and engagement features
 */
import { Points } from './Points'
import { Badges } from './Badges'
import { Achievements } from './Achievements'
import { Levels } from './Levels'
import { Streaks } from './Streaks'
import { Leaderboards } from './Leaderboards'

export const collections = [
  // Core System
  Users,
  Media,
  Tenants,
  StudentSettings,

  // Learning Management
  Courses,
  Modules,
  Lessons,
  Progress,
  Enrollments,

  // Gamification
  Points,
  Badges,
  Achievements,
  Levels,
  Streaks,
  Leaderboards,
]
