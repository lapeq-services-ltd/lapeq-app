export type Venue = {
    id: string;
    name: string;
    category: string;
    city: string;
    address?: string | null;
    description?: string | null;
    image_url: string | null;
    lat?: number | null;
    lng?: number | null;
    perks?: string | null;
    menu?: string | null;
};

export type VenueMedia = {
    id: string;
    venue_id: string;
    url: string;
    media_type: "image" | "video";
    caption: string | null;
    sort_order: number;
};

export type VenueMediaWithVenue = VenueMedia & {
    venues: Pick<Venue, "id" | "name" | "category" | "city"> | null;
};
