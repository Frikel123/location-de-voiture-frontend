import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContractPayload } from "@/lib/api";
import { contractsService } from "@/services/contracts/contracts.service";

export const contractsKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractsKeys.all, "list"] as const,
  detail: (id?: string | number) => [...contractsKeys.all, "detail", id] as const,
};

export const useContracts = () =>
  useQuery({
    queryKey: contractsKeys.lists(),
    queryFn: contractsService.list,
    staleTime: 60_000,
  });

export const useContract = (id?: string | number) =>
  useQuery({
    queryKey: contractsKeys.detail(id),
    queryFn: () => contractsService.get(id as string | number),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

export const useSaveContract = (id?: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContractPayload) =>
      id ? contractsService.update(id, payload) : contractsService.create(payload),
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractsKeys.detail(contract.id) });
      if (id) queryClient.invalidateQueries({ queryKey: contractsKeys.detail(id) });
      if (contract.contractToken) queryClient.invalidateQueries({ queryKey: ["public-contract-verification", contract.contractToken] });
      queryClient.invalidateQueries({ queryKey: ["public-contract-verification", contract.contractNumber] });
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-contracts-list"] });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contractsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-contracts-list"] });
    },
  });
};
