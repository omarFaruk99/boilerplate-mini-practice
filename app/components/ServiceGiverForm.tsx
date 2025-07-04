"use client";
import { updateServiceGiver } from "@/app/api/serviceGivers";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import type { FileUploadSelectEvent } from "primereact/fileupload";
import { FileUpload } from "primereact/fileupload";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

// Zod Schema
const serviceGiverSchema = z.object({
    id: z.number().optional(), // <-- Add id for edit mode
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    service_category: z.string().min(1, "Service category is required"),
    subcategory: z.string().optional(),
    skills: z.array(z.string()).optional(),
    years_of_experience: z.number().min(0).max(50).optional(),
    availability: z.array(z.string()).optional(),
    location: z.string().optional(),
    phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Invalid email format"),
    hourly_rate: z.number().min(0, "Hourly rate must be positive"),
    service_rating: z.number().min(0).max(5).optional(),
    background_check: z.boolean().optional(),
    languages: z.array(z.string()).optional(),
    preferred_contact_method: z.enum(["Phone", "Email", "SMS"]),
    notes: z.string().optional(),
    status: z.enum(["Active", "Inactive", "Suspended"]),
    profile_photo: z.any().optional(),
    documents: z.any().optional(),
});

type ServiceGiverFormData = z.infer<typeof serviceGiverSchema>;

interface ServiceGiverFormProps {
    initialData?: ServiceGiverFormData;
    isEditMode?: boolean;
}

const ServiceGiverForm = ({
    initialData,
    isEditMode = false,
}: ServiceGiverFormProps) => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    // Change to array for multiple images
    const [profilePhotos, setProfilePhotos] = useState<File[]>([]);
    const [documents, setDocuments] = useState<File[]>([]);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ServiceGiverFormData>({
        resolver: zodResolver(serviceGiverSchema),
        defaultValues: initialData,
    });

    // Fix: Reset form when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            // Convert string numbers to numbers for numeric fields
            const patchedData = {
                ...initialData,
                hourly_rate: initialData.hourly_rate
                    ? Number(initialData.hourly_rate)
                    : undefined,
                service_rating: initialData.service_rating
                    ? Number(initialData.service_rating)
                    : undefined,
                years_of_experience: initialData.years_of_experience
                    ? Number(initialData.years_of_experience)
                    : undefined,
            };
            reset(patchedData);
            // Optionally, set profile photo and documents preview if needed
        }
    }, [initialData, reset]);

    const onSubmit = async (data: ServiceGiverFormData) => {
        try {
            const formData = new FormData();

            // Append all non-file fields
            Object.entries(data).forEach(([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    !(key === "profile_photo" || key === "documents") &&
                    !(value instanceof File)
                ) {
                    if (key === "background_check") {
                        // Laravel expects "1" or "0" for booleans in FormData
                        formData.append(key, value ? "1" : "0");
                    } else if (Array.isArray(value)) {
                        value.forEach((item) =>
                            formData.append(`${key}[]`, item)
                        );
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            // Only append profile photo if a new file is selected
            if (profilePhotos[0]) {
                formData.append("profile_photo", profilePhotos[0]);
            }
            // Only append documents if new files are selected
            if (documents.length > 0) {
                documents.forEach((file, index) => {
                    formData.append(`documents[${index}]`, file);
                });
            }

            // Debug output (fix: use forEach for compatibility)
            formData.forEach((value, key) => {
                console.log(key, value);
            });

            if (isEditMode && initialData?.id) {
                try {
                    await updateServiceGiver(initialData.id, formData);
                    toast.current?.show({
                        severity: "success",
                        summary: "Success",
                        detail: "Service Giver updated!",
                    });
                    setTimeout(() => {
                        router.push("/");
                    }, 800); // Give user time to see the toast
                } catch (error) {
                    console.error("Update failed:", error);
                    toast.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to update. Please try again.",
                    });
                }
            } else {
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_BASE}/api/service-givers`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                toast.current?.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Service Giver added successfully!",
                });
            }
            // Reset form if not in edit mode
            if (!isEditMode) {
                reset();
                setProfilePhotos([]);
                setDocuments([]);
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: error.response?.data?.message || "Submission failed",
            });
        }
    };

    // Handle single profile photo upload with validation
    const onProfilePhotoUpload = (event: FileUploadSelectEvent) => {
        const files = event.files || [];
        const file = files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.current?.show({
                    severity: "error",
                    summary: "File Too Large",
                    detail: `${file.name} exceeds 2MB limit`,
                });
                setProfilePhotos([]);
                return;
            }
            setProfilePhotos([file]);
        } else {
            setProfilePhotos([]);
        }
    };

    // Handle documents upload with validation
    const onDocumentsUpload = (event: FileUploadSelectEvent) => {
        const validFiles = (event.files || []).filter((file) => {
            if (file.size > 5 * 1024 * 1024) {
                toast.current?.show({
                    severity: "error",
                    summary: "File Too Large",
                    detail: `${file.name} exceeds 5MB limit`,
                });
                return false;
            }
            return true;
        });

        setDocuments(validFiles);
    };

    // Options for dropdowns/multiselects
    const contactMethods = [
        { label: "Phone", value: "Phone" },
        { label: "Email", value: "Email" },
        { label: "SMS", value: "SMS" },
    ];

    const statusOptions = [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
        { label: "Suspended", value: "Suspended" },
    ];

    const skillOptions = [
        { label: "Plumbing", value: "Plumbing" },
        { label: "Electrical", value: "Electrical" },
        { label: "Carpentry", value: "Carpentry" },
        { label: "Cleaning", value: "Cleaning" },
        { label: "Gardening", value: "Gardening" },
        { label: "Painting", value: "Painting" },
    ];

    const availabilityOptions = [
        { label: "Weekdays", value: "Weekdays" },
        { label: "Weekends", value: "Weekends" },
        { label: "Evenings", value: "Evenings" },
        { label: "Mornings", value: "Mornings" },
        { label: "Flexible", value: "Flexible" },
    ];

    const languageOptions = [
        { label: "English", value: "English" },
        { label: "Spanish", value: "Spanish" },
        { label: "French", value: "French" },
        { label: "German", value: "German" },
        { label: "Chinese", value: "Chinese" },
    ];

    return (
        <div
            className="card p-fluid modern-form"
            style={{
                maxWidth: 900,
                margin: "32px auto",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                background: "#fff",
                padding: 32,
            }}
        >
            <Toast ref={toast} />
            <h2 style={{ fontWeight: 700, marginBottom: 24 }}>
                Add New Service Giver
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div
                    className="p-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 20,
                    }}
                >
                    {/* Full Name */}
                    <div className="field">
                        <label htmlFor="full_name">Full Name*</label>
                        <InputText
                            id="full_name"
                            {...register("full_name", {
                                required: "Full Name is required",
                            })}
                            style={{ borderRadius: 8, fontSize: 15 }}
                        />
                        {errors.full_name && (
                            <small className="p-error">
                                {errors.full_name.message}
                            </small>
                        )}
                    </div>

                    {/* Service Category */}
                    <div className="field">
                        <label htmlFor="service_category">
                            Service Category*
                        </label>
                        <InputText
                            id="service_category"
                            {...register("service_category", {
                                required: "Service Category is required",
                            })}
                            style={{ borderRadius: 8, fontSize: 15 }}
                        />
                        {errors.service_category && (
                            <small className="p-error">
                                {errors.service_category.message}
                            </small>
                        )}
                    </div>

                    {/* Subcategory */}
                    <div className="field">
                        <label htmlFor="subcategory">Subcategory</label>
                        <InputText
                            id="subcategory"
                            {...register("subcategory")}
                            style={{ borderRadius: 8, fontSize: 15 }}
                        />
                    </div>

                    {/* Skills */}
                    <div className="field">
                        <label htmlFor="skills">Skills</label>
                        <Controller
                            name="skills"
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => (
                                <MultiSelect
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={skillOptions}
                                    optionLabel="label"
                                    placeholder="Select Skills"
                                    style={{ borderRadius: 8, fontSize: 15 }}
                                />
                            )}
                        />
                    </div>

                    {/* Years of Experience */}
                    <div className="field">
                        <label htmlFor="years_of_experience">
                            Years of Experience
                        </label>
                        <Controller
                            name="years_of_experience"
                            control={control}
                            render={({ field }) => (
                                <InputNumber
                                    id="years_of_experience"
                                    min={0}
                                    value={field.value}
                                    onValueChange={(e) =>
                                        field.onChange(e.value)
                                    }
                                    onBlur={field.onBlur}
                                    style={{
                                        borderRadius: 8,
                                        fontSize: 15,
                                        width: "100%",
                                    }}
                                />
                            )}
                        />
                    </div>

                    {/* Availability */}
                    <div className="field">
                        <label htmlFor="availability">Availability</label>
                        <Controller
                            name="availability"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    id="availability"
                                    options={availabilityOptions}
                                    optionLabel="label"
                                    placeholder="Select Availability"
                                    {...field}
                                    style={{ borderRadius: 8, fontSize: 15 }}
                                />
                            )}
                        />
                    </div>

                    {/* Location */}
                    <div className="field">
                        <label htmlFor="location">Location</label>
                        <InputText
                            id="location"
                            {...register("location")}
                            style={{ borderRadius: 8, fontSize: 15 }}
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="field">
                        <label htmlFor="phone_number">Phone Number*</label>
                        <InputText
                            id="phone_number"
                            {...register("phone_number", {
                                required: "Phone Number is required",
                            })}
                            style={{ borderRadius: 8, fontSize: 15 }}
                        />
                        {errors.phone_number && (
                            <small className="p-error">
                                {errors.phone_number.message}
                            </small>
                        )}
                    </div>

                    {/* Email */}
                    <div className="field">
                        <label htmlFor="email">Email*</label>
                        <InputText
                            id="email"
                            type="email"
                            {...register("email", {
                                required: "Email is required",
                            })}
                            style={{ borderRadius: 8, fontSize: 15 }}
                        />
                        {errors.email && (
                            <small className="p-error">
                                {errors.email.message}
                            </small>
                        )}
                    </div>

                    {/* Hourly Rate */}
                    <div className="field">
                        <label htmlFor="hourly_rate">Hourly Rate*</label>
                        <Controller
                            name="hourly_rate"
                            control={control}
                            rules={{ required: "Hourly Rate is required" }}
                            render={({ field }) => (
                                <InputNumber
                                    id="hourly_rate"
                                    mode="currency"
                                    currency="USD"
                                    value={field.value}
                                    onValueChange={(e) =>
                                        field.onChange(e.value)
                                    }
                                    onBlur={field.onBlur}
                                    style={{
                                        borderRadius: 8,
                                        fontSize: 15,
                                        width: "100%",
                                    }}
                                />
                            )}
                        />
                        {errors.hourly_rate && (
                            <small className="p-error">
                                {errors.hourly_rate.message}
                            </small>
                        )}
                    </div>

                    {/* Service Rating */}
                    <div className="field">
                        <label htmlFor="service_rating">
                            Service Rating (0-5)
                        </label>
                        <Controller
                            name="service_rating"
                            control={control}
                            render={({ field }) => (
                                <InputNumber
                                    id="service_rating"
                                    min={0}
                                    max={5}
                                    value={field.value}
                                    onValueChange={(e) =>
                                        field.onChange(e.value)
                                    }
                                    onBlur={field.onBlur}
                                    style={{
                                        borderRadius: 8,
                                        fontSize: 15,
                                        width: "100%",
                                    }}
                                />
                            )}
                        />
                    </div>

                    {/* Background Check */}
                    <div className="field" style={{ gridColumn: "span 1" }}>
                        <label htmlFor="background_check">
                            Background Check
                        </label>
                        <div className="flex align-items-center">
                            <Controller
                                name="background_check"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => (
                                    <Checkbox
                                        inputId="background_check"
                                        checked={!!field.value}
                                        onChange={(e) =>
                                            field.onChange(e.checked)
                                        }
                                    />
                                )}
                            />
                            <label htmlFor="background_check" className="ml-2">
                                Has background check
                            </label>
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="field">
                        <label htmlFor="languages">Languages</label>
                        <Controller
                            name="languages"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    id="languages"
                                    options={languageOptions}
                                    optionLabel="label"
                                    placeholder="Select Languages"
                                    {...field}
                                    style={{ borderRadius: 8, fontSize: 15 }}
                                />
                            )}
                        />
                    </div>

                    {/* Preferred Contact Method */}
                    <div className="field">
                        <label htmlFor="preferred_contact_method">
                            Preferred Contact Method*
                        </label>
                        <Controller
                            name="preferred_contact_method"
                            control={control}
                            rules={{ required: "Contact Method is required" }}
                            render={({ field }) => (
                                <Dropdown
                                    id="preferred_contact_method"
                                    options={contactMethods}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select a method"
                                    {...field}
                                    style={{ borderRadius: 8, fontSize: 15 }}
                                />
                            )}
                        />
                        {errors.preferred_contact_method && (
                            <small className="p-error">
                                {errors.preferred_contact_method.message}
                            </small>
                        )}
                    </div>

                    {/* Status */}
                    <div className="field">
                        <label htmlFor="status">Status*</label>
                        <Controller
                            name="status"
                            control={control}
                            rules={{ required: "Status is required" }}
                            render={({ field }) => (
                                <Dropdown
                                    id="status"
                                    options={statusOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Select status"
                                    {...field}
                                    style={{ borderRadius: 8, fontSize: 15 }}
                                />
                            )}
                        />
                        {errors.status && (
                            <small className="p-error">
                                {errors.status.message}
                            </small>
                        )}
                    </div>
                </div>

                {/* Notes - full width */}
                <div className="field" style={{ marginTop: 18 }}>
                    <label htmlFor="notes">Notes</label>
                    <InputTextarea
                        id="notes"
                        rows={3}
                        {...register("notes")}
                        placeholder="Additional notes about the service giver..."
                        style={{ borderRadius: 8, fontSize: 15 }}
                    />
                </div>

                {/* Profile Photo Upload - full width */}
                <div className="field" style={{ marginTop: 18 }}>
                    <label htmlFor="profile_photo">Profile Photo</label>
                    <FileUpload
                        mode="basic"
                        name="profile_photos"
                        accept="image/*"
                        maxFileSize={2000000}
                        chooseLabel="Upload Photo"
                        onSelect={(e) => onProfilePhotoUpload(e)}
                    />
                    <small>
                        Max file size: 2MB. Allowed formats: JPEG, PNG. Only one
                        image allowed.
                    </small>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 8,
                        }}
                    >
                        {profilePhotos[0] && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    background: "#f4f4f4",
                                    borderRadius: 4,
                                    padding: "2px 8px",
                                }}
                            >
                                <span style={{ fontSize: 13, marginRight: 6 }}>
                                    {profilePhotos[0].name}
                                </span>
                                <Button
                                    icon="pi pi-times"
                                    className="p-button-text p-button-danger p-button-sm"
                                    style={{
                                        padding: 0,
                                        width: 22,
                                        height: 22,
                                    }}
                                    type="button"
                                    onClick={() => setProfilePhotos([])}
                                    aria-label={`Remove ${profilePhotos[0].name}`}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents Upload - full width */}
                <div className="field" style={{ marginTop: 18 }}>
                    <label htmlFor="documents">
                        Documents (PDF, DOC, DOCX)
                    </label>
                    <FileUpload
                        mode="basic"
                        name="documents"
                        accept=".pdf,.doc,.docx"
                        multiple
                        maxFileSize={5000000}
                        chooseLabel="Upload Documents"
                        onSelect={(e) => onDocumentsUpload(e)}
                    />
                    <small>Max file size: 5MB per file. Max files: 5.</small>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 8,
                        }}
                    >
                        {documents.map((file, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    background: "#f4f4f4",
                                    borderRadius: 4,
                                    padding: "2px 8px",
                                }}
                            >
                                <span style={{ fontSize: 13, marginRight: 6 }}>
                                    {file.name}
                                </span>
                                <Button
                                    icon="pi pi-times"
                                    className="p-button-text p-button-danger p-button-sm"
                                    style={{
                                        padding: 0,
                                        width: 22,
                                        height: 22,
                                    }}
                                    type="button"
                                    onClick={() => {
                                        setDocuments(
                                            documents.filter(
                                                (_, i) => i !== idx
                                            )
                                        );
                                    }}
                                    aria-label={`Remove ${file.name}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button - full width */}
                <div
                    className="field"
                    style={{ marginTop: 28, textAlign: "right" }}
                >
                    <Button
                        type="submit"
                        label="Submit"
                        className="mt-3 p-button-rounded p-button-lg"
                        style={{
                            padding: "10px 32px",
                            fontSize: 16,
                            borderRadius: 8,
                        }}
                    />
                </div>
            </form>
        </div>
    );
};

export default ServiceGiverForm;
