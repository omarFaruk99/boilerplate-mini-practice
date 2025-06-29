"use client";
import { useQuery } from "@tanstack/react-query";
import {
    fetchServiceGivers,
    ServiceGiversResponse,
} from "../api/serviceGivers";

// Custom hook to fetch service-givers with polling every 5 seconds
export const useServiceGivers = () => {
    return useQuery<ServiceGiversResponse>({
        queryKey: ["service-givers"],
        queryFn: fetchServiceGivers,
        // refetchInterval: 5000, // Poll every 5 seconds
    });
};
