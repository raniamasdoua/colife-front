import { http, HttpResponse } from "msw";
import type {
  ActivityResponse,
  CarpoolDetail,
  ActivityParticipant,
} from "../../types/activity";
import type { UserProfile } from "../../types/auth";

const API = "http://localhost:8080/api";

export const MOCK_USER: UserProfile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  firstName: "Alice",
  lastName: "Martin",
  email: "alice.martin@test.fr",
  role: "COLLABORATOR",
  bio: null,
  phone: null,
  address: null,
  createdAt: "2025-01-01T00:00:00",
};

export const FUTURE_ACTIVITY: ActivityResponse = {
  id: 1,
  title: "Yoga du matin",
  description: "Session relaxante",
  capacity: 10,
  participantCount: 3,
  location: {
    room: "Salle A",
    street: null,
    complement: null,
    postalCode: null,
    city: null,
  },
  activityType: { id: 1, name: "Yoga" },
  date: "2099-06-15",
  startTime: "09:00:00",
  endTime: "10:00:00",
  organizerName: "Alice Martin",
  locationType: "ON_SITE",
  carpool: null,
  materials: [],
};

export const PAST_ACTIVITY: ActivityResponse = {
  ...FUTURE_ACTIVITY,
  id: 2,
  title: "Activité passée",
  date: "2020-01-01",
};

export const MOCK_CARPOOL: CarpoolDetail = {
  id: 1,
  activityId: 1,
  driverId: "550e8400-e29b-41d4-a716-446655440000",
  driverName: "Alice Martin",
  departureTime: "08:30:00",
  maxPassengers: 3,
  passengerCount: 1,
  availableSeats: 2,
  status: "ACTIVE",
  passengers: [],
};

export const MOCK_PARTICIPANT: ActivityParticipant = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  firstName: "Bob",
  lastName: "Dupont",
  email: "bob.dupont@test.fr",
};

export const handlers = [
  http.get(`${API}/auth/me`, () => HttpResponse.json(MOCK_USER)),

  http.get(`${API}/activities/mine`, () => HttpResponse.json([FUTURE_ACTIVITY])),
  http.get(`${API}/activities/registered`, () => HttpResponse.json([FUTURE_ACTIVITY])),
  http.get(`${API}/activities/available`, () =>
    HttpResponse.json([FUTURE_ACTIVITY, PAST_ACTIVITY])
  ),
  http.get(`${API}/activities`, () => HttpResponse.json([FUTURE_ACTIVITY])),
  http.post(`${API}/activities`, () =>
    HttpResponse.json(FUTURE_ACTIVITY, { status: 201 })
  ),
  http.put(`${API}/activities/:id`, () => HttpResponse.json(FUTURE_ACTIVITY)),
  http.delete(`${API}/activities/:id`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${API}/activities/:id/subscribe`, () =>
    HttpResponse.json({ ...FUTURE_ACTIVITY, participantCount: 4 }, { status: 201 })
  ),
  http.delete(`${API}/activities/:id/subscribe`, () =>
    HttpResponse.json({ ...FUTURE_ACTIVITY, participantCount: 2 })
  ),

  http.get(`${API}/activities/:id/participants`, () =>
    HttpResponse.json([MOCK_PARTICIPANT])
  ),
  http.get(`${API}/activities/:id/carpools`, () =>
    HttpResponse.json({ carpools: [MOCK_CARPOOL], userRole: "DRIVER", userCarpoolId: 1 })
  ),
  http.post(`${API}/activities/:id/carpools`, () =>
    HttpResponse.json(MOCK_CARPOOL, { status: 201 })
  ),
  http.post(`${API}/activities/:id/carpools/:carpoolId/join`, () =>
    HttpResponse.json({ ...MOCK_CARPOOL, passengerCount: 2, availableSeats: 1 })
  ),
  http.delete(`${API}/activities/:id/carpools/:carpoolId/leave`, () =>
    new HttpResponse(null, { status: 204 })
  ),
  http.put(`${API}/activities/:id/carpools/:carpoolId`, () =>
    HttpResponse.json({ ...MOCK_CARPOOL, maxPassengers: 4, availableSeats: 3 })
  ),
  http.delete(`${API}/activities/:id/carpools/:carpoolId`, () =>
    new HttpResponse(null, { status: 204 })
  ),

  http.get(`${API}/activity-types`, () =>
    HttpResponse.json([
      { id: 1, name: "Yoga" },
      { id: 2, name: "Sport" },
    ])
  ),
  http.get(`${API}/activity-types/count`, () => HttpResponse.json({ count: 2 })),
  http.post(`${API}/activity-types`, () =>
    HttpResponse.json({ id: 3, name: "Pilates" }, { status: 201 })
  ),
  http.put(`${API}/activity-types/:id`, () =>
    HttpResponse.json({ id: 1, name: "Yoga modifié" })
  ),
  http.delete(`${API}/activity-types/:id`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API}/user`, () => HttpResponse.json([MOCK_USER])),
  http.get(`${API}/user/count`, () => HttpResponse.json({ count: 42 })),
  http.patch(`${API}/user/:id/profile`, () =>
    HttpResponse.json({ ...MOCK_USER, bio: "Nouveau bio" })
  ),
];
