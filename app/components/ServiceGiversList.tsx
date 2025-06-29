"use client";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React from "react";
import { useServiceGivers } from "../hooks/useServiceGivers";

const ServiceGiversList: React.FC = () => {
    const { data, isLoading, isError, error } = useServiceGivers();

    if (isLoading) return <div>Loading service givers...</div>;
    if (isError) return <div>Error: {(error as Error).message}</div>;
    if (!data || !data.data.length) return <div>No service givers found.</div>;

    return (
        <div className="card">
            <h2>Service Givers</h2>
            <DataTable
                value={data.data}
                paginator
                rows={10}
                tableStyle={{ minWidth: "50rem" }}
            >
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
