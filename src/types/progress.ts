export interface VideoProgress {
  path: string
  duration?: number
  currentTime?: number
  lastUpdated?: number
  completed: boolean
}

export interface CourseProgress {
  version: string,
  coursePath: string,
  courseRootPath: string,
  videos: { [key: string]: VideoProgress },
  dirProgress: { [key: string]: number }
}
