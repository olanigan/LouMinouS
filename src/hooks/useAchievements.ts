import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { checkProgress, getUserAchievements, getAvailableAchievements, getAchievementProgress } from '@/app/actions/achievements'
import { toast } from 'sonner'

export function useUserAchievements() {
  return useQuery({
    queryKey: ['user-achievements'],
    queryFn: getUserAchievements,
  })
}

export function useAvailableAchievements() {
  return useQuery({
    queryKey: ['available-achievements'],
    queryFn: getAvailableAchievements,
  })
}

export function useAchievementProgress(achievementId: string) {
  return useQuery({
    queryKey: ['achievement-progress', achievementId],
    queryFn: () => getAchievementProgress(achievementId),
    enabled: !!achievementId,
  })
}

export function useCheckProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: checkProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] })
      queryClient.invalidateQueries({ queryKey: ['available-achievements'] })
      toast.success('Achievement progress updated')
    },
    onError: (error) => {
      toast.error('Failed to check achievement progress')
      console.error('Achievement progress check error:', error)
    },
  })
} 