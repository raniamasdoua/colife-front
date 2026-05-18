/** Réponse GET /activity-types */
export interface ActivityTypeOption {
  id: number;
  name: string;
}

export type LocationType = "ON_SITE" | "OFF_SITE";

export interface CarpoolRequest {
  departureTime: string;
  maxPassengers: number;
}

export interface CarpoolResponse {
  id: number;
  activityId: number;
  driverId: number;
  departureTime: string;
  maxPassengers: number;
}

/** Corps PUT /activities/{id} — aligné sur UpdateActivityRequestDto (backend). */
export interface UpdateActivityPayload {
  title: string;
  description?: string | null;
  activityTypeId: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: {
    room?: string | null;
    street?: string | null;
    complement?: string | null;
    postalCode?: string | null;
    city?: string | null;
  };
  locationType?: LocationType;
}

/** Corps POST /activities — aligné sur CreateActivityRequestDto (backend). */
export interface CreateActivityPayload {
  title: string;
  description?: string | null;
  activityTypeId: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: {
    room?: string | null;
    street?: string | null;
    complement?: string | null;
    postalCode?: string | null;
    city?: string | null;
  };
  locationType?: LocationType;
  carpool?: CarpoolRequest | null;
}

export interface ActivityParticipant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ActivityResponse {
  id: number;
  title: string;
  description: string | null;
  capacity: number;
  participantCount: number;
  location: {
    room: string | null;
    street: string | null;
    complement: string | null;
    postalCode: string | null;
    city: string | null;
  };
  activityType: { id: number; name: string };
  date: string;
  startTime: string;
  endTime: string;
  organizerName: string;
  deleted?: boolean;
  locationType: LocationType;
  carpool: CarpoolResponse | null;
}

