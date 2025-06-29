"use client";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import React, { useRef } from "react";
import { useServiceGivers } from "../hooks/useServiceGivers";

const ServiceGiversList: React.FC = () => {
    const { data, isLoading, isError, error, deleteMutation } =
        useServiceGivers();
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const renderProfilePhoto = (rowData: any) => {
        // Use the correct environment variable for the API base URL
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "";
        const photoUrl = rowData.profile_photo
            ? rowData.profile_photo.startsWith("http")
                ? rowData.profile_photo
                : `${baseUrl}/${rowData.profile_photo}`
            : "/default-profile.png"; // fallback image
        return (
            <a
                href={photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to preview"
            >
                <img
                    src={photoUrl}
                    alt={rowData.full_name}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        objectFit: "cover",
                        cursor: "pointer",
                        border: "1px solid #eee",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                />
            </a>
        );
    };

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id, {
            onSuccess: () => {
                toast.current?.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Service Giver deleted successfully!",
                });
            },
            onError: () => {
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to delete service giver.",
                });
            },
        });
    };

    const renderDeleteButton = (rowData: any) => {
        return (
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger p-button-sm"
                onClick={() => handleDelete(rowData.id)}
                aria-label="Delete"
            />
        );
    };

    const renderEditButton = (rowData: any) => {
        return (
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-info p-button-sm"
                onClick={() => router.push(`/edit-service/${rowData.id}`)}
                aria-label="Edit"
            />
        );
    };

    if (isLoading) return <div>Loading service givers...</div>;
    if (isError) return <div>Error: {(error as Error).message}</div>;
    if (!data || !data.data.length) return <div>No service givers found.</div>;

    console.log("data=========", data);
    return (
        <div>
            <Toast ref={toast} />
            <h2>Service Givers</h2>
            <DataTable
                value={data.data}
                paginator
                rows={10}
                tableStyle={{ minWidth: "50rem" }}
            >
                <Column
                    header="Photo"
                    body={renderProfilePhoto}
                    style={{ width: "70px" }}
                />
                <Column field="full_name" header="Name" sortable />
                <Column field="service_category" header="Category" sortable />
                <Column field="phone_number" header="Phone" />
                <Column field="email" header="Email" />
                <Column field="hourly_rate" header="Hourly Rate" />
                <Column field="status" header="Status" />
                <Column
                    header="Actions"
                    body={(rowData) => (
                        <div className="flex gap-2">
                            {renderEditButton(rowData)}
                            {renderDeleteButton(rowData)}
                        </div>
                    )}
                    style={{ width: "120px" }}
                />
            </DataTable>
        </div>
    );
};

export default ServiceGiversList;
