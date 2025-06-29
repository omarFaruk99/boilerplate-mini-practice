"use client";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React from "react";
import { useServiceGivers } from "../hooks/useServiceGivers";

const ServiceGiversList: React.FC = () => {
    const { data, isLoading, isError, error } = useServiceGivers();

    const renderProfilePhoto = (rowData: any) => {
        // Use the correct environment variable for the API base URL
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "";
        const photoUrl = rowData.profile_photo
            ? rowData.profile_photo.startsWith("http")
                ? rowData.profile_photo
                : `${baseUrl}/${rowData.profile_photo}`
            : "/default-profile.png"; // fallback image
        return (
            <img
                src={photoUrl}
                alt={rowData.full_name}
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                }}
            />
        );
    };

    if (isLoading) return <div>Loading service givers...</div>;
    if (isError) return <div>Error: {(error as Error).message}</div>;
    if (!data || !data.data.length) return <div>No service givers found.</div>;

    console.log("data=========", data);
    return (
        <div>
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
            </DataTable>
        </div>
    );
};

export default ServiceGiversList;
