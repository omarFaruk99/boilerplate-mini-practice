import { fetchServiceGiverById } from "@/app/api/serviceGivers";
import ServiceGiverForm from "@/app/components/ServiceGiverForm";

interface EditServicePageProps {
    params: { id: string };
}

function normalizeServiceGiver(data: any) {
    if (!data) return {};
    return {
        ...data,
        skills: Array.isArray(data.skills)
            ? data.skills
            : data.skills
            ? data.skills.split(",").map((s: string) => s.trim())
            : [],
        availability: Array.isArray(data.availability)
            ? data.availability
            : data.availability
            ? data.availability.split(",").map((s: string) => s.trim())
            : [],
        languages: Array.isArray(data.languages)
            ? data.languages
            : data.languages
            ? data.languages.split(",").map((s: string) => s.trim())
            : [],
        hourly_rate:
            typeof data.hourly_rate === "string"
                ? Number(data.hourly_rate)
                : data.hourly_rate,
        years_of_experience:
            typeof data.years_of_experience === "string"
                ? Number(data.years_of_experience)
                : data.years_of_experience,
        service_rating:
            typeof data.service_rating === "string"
                ? Number(data.service_rating)
                : data.service_rating,
        background_check: Boolean(data.background_check),
    };
}

const EditServicePage = async ({ params }: EditServicePageProps) => {
    const serviceGiverRaw = await fetchServiceGiverById(Number(params.id));
    const serviceGiver = normalizeServiceGiver(serviceGiverRaw);

    return (
        <div className="p-4">
            <ServiceGiverForm initialData={serviceGiver} isEditMode />
        </div>
    );
};

export default EditServicePage;
