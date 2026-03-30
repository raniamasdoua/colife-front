/** Réponse GET /activity-types */
export interface ActivityTypeOption {
  id: number;
  name: string;
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
    street: string;
    complement?: string | null;
    postalCode: string;
    city: string;
  };
}

export interface ActivityResponse {
  id: number;
  title: string;
  description: string | null;
  capacity: number;
  location: {
    street: string;
    complement: string | null;
    postalCode: string;
    city: string;
  };
  activityType: { id: number; name: string };
  date: string;
  startTime: string;
  endTime: string;
}

