import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeveloperProfile,
  updateDeveloperProfile,
} from "./profileStore";

/**
 * Query key factory for developer profile queries
 */
export const devProfileKeys = {
  all: ["devProfile"] as const,
  profile: () => [...devProfileKeys.all, "data"] as const,
};

/**
 * Fetch developer profile
 */
export function useDeveloperProfile(enabled = true) {
  return useQuery({
    queryKey: devProfileKeys.profile(),
    queryFn: fetchDeveloperProfile,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update developer profile
 */
export function useUpdateDeveloperProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeveloperProfile,
    onSuccess: (updatedProfile) => {
      // Invalidate profile to refetch
      queryClient.invalidateQueries({
        queryKey: devProfileKeys.profile(),
      });
      // Optimistically update cache
      queryClient.setQueryData(devProfileKeys.profile(), updatedProfile);
    },
  });
}
