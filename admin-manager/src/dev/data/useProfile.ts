import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeveloperProfile,
  updateDeveloperProfile,
} from "./profileStore";


export const devProfileKeys = {
  all: ["devProfile"] as const,
  profile: () => [...devProfileKeys.all, "data"] as const,
};


export function useDeveloperProfile(enabled = true) {
  return useQuery({
    queryKey: devProfileKeys.profile(),
    queryFn: fetchDeveloperProfile,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}


export function useUpdateDeveloperProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeveloperProfile,
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({
        queryKey: devProfileKeys.profile(),
      });
      queryClient.setQueryData(devProfileKeys.profile(), updatedProfile);
    },
  });
}

