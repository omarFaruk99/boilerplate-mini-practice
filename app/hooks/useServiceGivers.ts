"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteServiceGiver,
    fetchServiceGivers,
    ServiceGiversResponse,
} from "../api/serviceGivers";

/**
 * Custom hook for managing service givers data
 * Handles fetching, caching, and deleting service givers
 * Uses React Query for state management
 */
export const useServiceGivers = () => {
    // Access the query client for cache management
    const queryClient = useQueryClient();

    // Mutation for deleting a service giver
    const deleteMutation = useMutation({
        mutationFn: deleteServiceGiver, // Function to call for deletion
        onSuccess: () => {
            // Invalidate the query to refetch fresh data after successful deletion
            queryClient.invalidateQueries({ queryKey: ["service-givers"] });
        },
    });

    // Query for fetching service givers data
    const { data, isLoading, isError, error } = useQuery<ServiceGiversResponse>(
        {
            queryKey: ["service-givers"], // Unique key for caching
            queryFn: fetchServiceGivers, // Function to fetch data
            // Optional: Uncomment to enable auto-refresh every 5 seconds
            // refetchInterval: 5000,
        }
    );

    // Return all the state and mutation methods for components to use
    return { data, isLoading, isError, error, deleteMutation };
};
