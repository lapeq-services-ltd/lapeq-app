export type ServiceId =
    | "corporate-pairing"
    | "logistics"
    | "diaspora-support"
    | "lifestyle-travel"
    | "driving-service"
    | "project-trust";

export const SERVICES: {
    id: ServiceId;
    label: string;
    description: string;
    icon: string;
}[] = [
        {
            id: "driving-service",
            label: "Driving Service",
            description: "Scheduled rides and chauffeur coordination",
            icon: "car",
        },
        {
            id: "logistics",
            label: "Logistics",
            description: "Pickup, delivery, and item movement",
            icon: "package",
        },
        {
            id: "lifestyle-travel",
            label: "Lifestyle & Travel",
            description: "Hotels, experiences, and travel coordination",
            icon: "plane",
        },
        {
            id: "corporate-pairing",
            label: "Corporate Pairing",
            description: "Business introductions and professional connections",
            icon: "briefcase",
        },
        {
            id: "diaspora-support",
            label: "Diaspora Support",
            description: "Remote assistance for Nigerians abroad",
            icon: "globe",
        },
        {
            id: "project-trust",
            label: "Project Trust",
            description: "Independent construction oversight & reporting",
            icon: "building",
        },
    ];
