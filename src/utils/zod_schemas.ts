import { z } from 'zod';

// --- Shared Validators ---
const uuidSchema = z.string().uuid();
const createdBySchema = uuidSchema.optional();
const phoneE164Schema = z.string().nullable().optional(); // Relaxed validation. Normalization happens on save.
const rutSchema = z.string(); // We assume normalized RUT from UI

// --- Enums ---
export const RoleEnum = z.enum(['admin', 'logistica']);
export const LocationTypeEnum = z.enum(['city', 'port', 'center', 'base', 'other']);
export const OperatorTypeEnum = z.enum(['airline', 'marine', 'internal', 'other']);
export const VesselTypeEnum = z.enum(['lancha', 'barcaza', 'other']);
export const TransportModeEnum = z.enum(['avion', 'lancha', 'interno']);
export const ItineraryStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'suspended']);

// --- Schemas ---

export const personSchema = z.object({
    id: uuidSchema.optional(),
    rut_normalized: rutSchema,
    rut_display: z.string(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    company: z.string().min(1),
    job_title: z.string().nullable().optional(),
    phone_e164: phoneE164Schema,
    active: z.boolean().default(true),
    is_crew: z.boolean().default(false),
});

export const locationSchema = z.object({
    id: uuidSchema.optional(),
    code: z.string().min(2).max(10),
    name: z.string().min(1),
    type: LocationTypeEnum,
    active: z.boolean().default(true),
});

export const operatorSchema = z.object({
    id: uuidSchema.optional(),
    name: z.string().min(1),
    type: OperatorTypeEnum,
    active: z.boolean().default(true),
});

export const vesselSchema = z.object({
    id: uuidSchema.optional(),
    name: z.string().min(2, 'Name is required'),
    type: VesselTypeEnum,
    capacity: z.coerce.number().int().nonnegative().default(0),
    active: z.boolean().default(true),
});

export const itineraryCrewSchema = z.object({
    id: uuidSchema.optional(),
    itinerary_id: uuidSchema,
    person_id: uuidSchema,
    role: z.enum(['captain', 'substitute', 'crew_member']),
});

export type ItineraryCrew = z.infer<typeof itineraryCrewSchema>;

export const routeSchema = z.object({
    id: uuidSchema.optional(),
    mode: TransportModeEnum,
    origin_location_id: uuidSchema,
    destination_location_id: uuidSchema,
    default_operator_id: uuidSchema.nullable().optional(),
    default_vessel_id: uuidSchema.nullable().optional(),
    active: z.boolean().default(true),
});

// Itinerary Stop Schema
export const itineraryStopSchema = z.object({
    id: uuidSchema.optional(),
    itinerary_id: uuidSchema.optional(),
    location_id: uuidSchema,
    stop_order: z.number().int().nonnegative(),
    arrival_time: z.string().optional(), // HH:MM:SS
    departure_time: z.string().optional(), // HH:MM:SS
});
export type ItineraryStop = z.infer<typeof itineraryStopSchema>;

// Itinerary Schema
export const itinerarySchema = z.object({
    id: uuidSchema.optional(),
    vessel_id: uuidSchema,
    date: z.string(), // YYYY-MM-DD
    start_time: z.string(), // HH:MM
    status: ItineraryStatusEnum.default('scheduled'),
    stops: z.array(itineraryStopSchema).min(2, "Must have at least origin and destination"),
    created_at: z.string().optional(),
});
export type Itinerary = z.infer<typeof itinerarySchema>;

export const itinerarySegmentSchema = z.object({
    id: uuidSchema.optional(),
    itinerary_id: uuidSchema,
    seq: z.number().int(),
    route_id: uuidSchema.nullable().optional(),
    mode: TransportModeEnum,
    origin_location_id: uuidSchema,
    destination_location_id: uuidSchema,
    operator_id: uuidSchema.nullable().optional(),
    vessel_id: uuidSchema.nullable().optional(),
    presentation_at: z.string().nullable().optional(), // ISO string from UI
    departure_at: z.string(), // ISO string
    ticket: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

export type Person = z.infer<typeof personSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Operator = z.infer<typeof operatorSchema>;
export type Vessel = z.infer<typeof vesselSchema>;
export type Route = z.infer<typeof routeSchema>;

export type ItinerarySegment = z.infer<typeof itinerarySegmentSchema>;
