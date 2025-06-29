import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export interface ServiceGiver {
    id: number;
    full_name: string;
    service_category: string;
    subcategory: string | null;
    skills: string | null;
    years_of_experience: number;
    availability: string | null;
    location: string | null;
    phone_number: string;
    email: string;
    hourly_rate: string;
    service_rating: string;
    background_check: boolean;
    profile_photo: string;
    documents: string[];
    languages: string | null;
    preferred_contact_method: string;
    notes: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface ServiceGiversResponse {
    current_page: number;
    data: ServiceGiver[];
    total: number;
    per_page: number;
    // ...add other fields as needed
}

export const fetchServiceGivers = async (): Promise<ServiceGiversResponse> => {
    const response = await axios.get(`${API_BASE}/api/service-givers`);
    return response.data;
};

export const deleteServiceGiver = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/api/service-givers/${id}`);
};
