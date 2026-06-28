/** Réponse GET /activity-types */
export interface ActivityTypeOption {
  id: number;
  name: string;
}

export type LocationType = "ON_SITE" | "OFF_SITE";

export type CarpoolStatus = "ACTIVE" | "CANCELLED";

export type CarpoolUserRole = "DRIVER" | "PASSENGER" | "NONE";

export interface CarpoolRequest {
  departureTime: string;
  maxPassengers: number;
}

export interface CarpoolResponse {
  id: number;
  activityId: number;
  /** Identité Keycloak du conducteur (UUID sérialisé en chaîne). */
  driverId: string;
  departureTime: string;
  maxPassengers: number;
}

export interface CarpoolPassengerSummary {
  /** Identité Keycloak du passager (UUID sérialisé en chaîne). */
  userId: string;
  fullName: string;
}

/** Détail d'un covoiturage retourné par GET /activities/{id}/carpools */
export interface CarpoolDetail {
  id: number;
  activityId: number;
  /** Identité Keycloak du conducteur (UUID sérialisé en chaîne). */
  driverId: string;
  driverName: string;
  departureTime: string;
  maxPassengers: number;
  passengerCount: number;
  availableSeats: number;
  status: CarpoolStatus;
  passengers: CarpoolPassengerSummary[];
}

/** Réponse de GET /activities/{id}/carpools */
export interface ActivityCarpoolsResponse {
  carpools: CarpoolDetail[];
  userRole: CarpoolUserRole;
  userCarpoolId: number | null;
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
  /** Identité Keycloak du participant (UUID sérialisé en chaîne). */
  id: string;
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

