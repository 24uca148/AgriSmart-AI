import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Helper to log and parse Zod responses safely
function parseResponse<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod Error] ${label} validation failed:`, result.error.format());
    throw new Error(`Invalid response format from ${label}`);
  }
  return result.data;
}

export function usePredictions() {
  return useQuery({
    queryKey: [api.predictions.list.path],
    queryFn: async () => {
      const res = await fetch(api.predictions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch predictions");
      const data = await res.json();
      return parseResponse(api.predictions.list.responses[200], data, "GET /api/predictions");
    },
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: z.infer<typeof api.predictions.create.input>) => {
      const validated = api.predictions.create.input.parse(input);
      const res = await fetch(api.predictions.create.path, {
        method: api.predictions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Validation failed");
        }
        throw new Error("Failed to generate prediction");
      }

      const data = await res.json();
      return parseResponse(api.predictions.create.responses[201], data, "POST /api/predictions");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.predictions.list.path] });
      toast({
        title: "Prediction Complete",
        description: "Your agricultural advisory has been generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateSyntheticData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.predictions.syntheticData.path, {
        method: api.predictions.syntheticData.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to generate synthetic data");
      }

      const data = await res.json();
      return parseResponse(api.predictions.syntheticData.responses[200], data, "POST /api/synthetic-data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.predictions.list.path] });
      toast({
        title: "Model Trained",
        description: "Synthetic data generated and models updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
