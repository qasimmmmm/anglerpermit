import { z } from "zod";

/**
 * StateConfig — the SINGLE shared contract for every state page.
 * Implemented verbatim from /spec/stateconfig.md.
 * State agents: do NOT modify this file. Add your state in src/data/states/<slug>.ts.
 */

export type FieldType =
  | "text" | "email" | "tel" | "date" | "select" | "radio" | "checkbox"
  | "ssn" | "number" | "zip" | "textarea";

export interface FieldOption {
  value: string;
  label: string;
}

export interface ConditionalRule {
  field: string; // name of the controlling field
  equals?: string; // show this field when controlling field === value
  oneOf?: string[]; // show when controlling field is one of these
}

export interface FormFieldDef {
  name: string; // camelCase key, e.g. 'firstName'
  label: string; // EXACT label from official portal
  type: FieldType;
  required: boolean;
  options?: FieldOption[]; // for select/radio — EXACT official options
  placeholder?: string;
  helpText?: string; // e.g. "Why is this required?" explainer
  mask?: "ssn" | "phone" | "dob" | "zip"; // input mask
  autocomplete?: string; // e.g. 'given-name', 'email'
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    min?: number;
    max?: number;
  };
  conditional?: ConditionalRule; // conditional display logic
  step: 2; // all applicant fields are wizard step 2
  officialNote?: string; // provenance note / TODO: verify + URL
}

export interface AddOn {
  id: string; // kebab-case, e.g. 'second-rod-validation'
  name: string; // EXACT official name
  price: number; // official price in USD
  required: boolean; // e.g. CO Habitat Stamp auto-added
  appliesTo?: string[]; // license ids it applies to; omit = all
  description?: string;
  officialNote?: string;
}

export interface LicenseOption {
  id: string; // kebab-case
  name: string; // EXACT official license name
  price: number; // official price USD
  residency: "resident" | "nonresident" | "senior" | "youth" | "any";
  duration: string; // e.g. 'Annual', '1-Day', '10-Day', 'Lifetime'
  category: "freshwater" | "saltwater" | "all-water" | "combo" | "other";
  description?: string;
  suggestedAddOns?: string[]; // add-on ids commonly paired
  officialNote?: string;
}

export interface StateConfig {
  slug: string; // 'michigan' | 'california' | 'texas' | 'colorado' |
  // 'north-carolina' | 'florida' | 'south-carolina'
  stateName: string; // 'Michigan'
  officialAgencyName: string; // 'Michigan Department of Natural Resources'
  officialPortalName: string; // 'Michigan DNR eLicense'
  officialPortalUrl: string; // https://...
  lastVerified: string; // 'YYYY-MM-DD'
  serviceFee: number; // placeholder, editable; default 29
  requiresSSN: boolean; // show masked SSN field w/ explainer
  ssnExplainer?: string; // state-law one-liner
  residencyOptions: { value: string; label: string }[]; // drives license filtering
  licenseYearNote?: string; // e.g. TX: 'Valid Sep 1 – Aug 31'
  licenses: LicenseOption[];
  addOns: AddOn[];
  formFields: FormFieldDef[]; // EXACT official applicant fields, in order
  stateIdentifiers?: {
    // e.g. CA GO ID, MI DNR Sportcard, TX customer #
    name: string;
    label: string;
    helpText: string;
    required: boolean;
  }[];
  consentExtra?: string; // state-specific consent text if any
  researchNotes?: string; // free-form provenance, discrepancies
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Licenses visible for a given residency selection ('any' licenses always visible). */
export function licensesForResidency(
  config: StateConfig,
  residency: string | undefined,
): LicenseOption[] {
  if (!residency) return config.licenses;
  return config.licenses.filter(
    (l) => l.residency === "any" || l.residency === residency,
  );
}

/** Add-ons applicable to a given license (omit appliesTo = applies to all). */
export function addOnsForLicense(
  config: StateConfig,
  licenseId: string | undefined,
): AddOn[] {
  return config.addOns.filter(
    (a) => !a.appliesTo || (licenseId ? a.appliesTo.includes(licenseId) : true),
  );
}

/** True when a conditional field should be visible given current values. */
export function isFieldVisible(
  field: FormFieldDef,
  values: Record<string, unknown>,
): boolean {
  if (!field.conditional) return true;
  const controlling = values[field.conditional.field];
  const asString =
    typeof controlling === "string" ? controlling : String(controlling ?? "");
  if (field.conditional.equals !== undefined) {
    return asString === field.conditional.equals;
  }
  if (field.conditional.oneOf) {
    return field.conditional.oneOf.includes(asString);
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Zod schema generation                                               */
/* ------------------------------------------------------------------ */

const SSN_PATTERN = /^\d{3}-\d{2}-\d{4}$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const PHONE_PATTERN = /^\(\d{3}\) \d{3}-\d{4}$/;
const DOB_PATTERN = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

/** Normalize empty / missing input so optional fields accept "" and required fields produce friendly messages. */
function normalizeEmpty(value: unknown): unknown {
  if (value === undefined || value === null) return "";
  return value;
}

/**
 * Build a zod schema for ONE form field from its definition.
 * Every supported FieldType is handled.
 */
export function buildFieldSchema(field: FormFieldDef): z.ZodTypeAny {
  const label = field.label;
  const v = field.validation ?? {};

  switch (field.type) {
    case "email": {
      const s = z.string().email(`Enter a valid email address`);
      return wrapRequired(s, field, label);
    }
    case "tel": {
      const s = z
        .string()
        .regex(PHONE_PATTERN, `Enter a valid phone number, e.g. (555) 123-4567`);
      return wrapRequired(s, field, label);
    }
    case "date": {
      // DOB-style mask (MM/DD/YYYY) or free date string
      const s =
        field.mask === "dob"
          ? z.string().regex(DOB_PATTERN, `Enter ${label} as MM/DD/YYYY`)
          : z.string().min(1, `${label} is required`);
      return wrapRequired(s, field, label);
    }
    case "ssn": {
      const s = z
        .string()
        .regex(SSN_PATTERN, `Enter a valid SSN in the format 123-45-6789`);
      return wrapRequired(s, field, label);
    }
    case "zip": {
      const s = z
        .string()
        .regex(ZIP_PATTERN, `Enter a valid ZIP code, e.g. 12345 or 12345-6789`);
      return wrapRequired(s, field, label);
    }
    case "select":
    case "radio": {
      const values = (field.options ?? []).map((o) => o.value);
      const s = z
        .string()
        .min(1, `${label} is required`)
        .refine((val) => values.length === 0 || values.includes(val), {
          message: `Select a valid option for ${label}`,
        });
      return wrapRequired(s, field, label);
    }
    case "checkbox": {
      if (field.required) {
        return z.literal(true, {
          error: `${label} must be checked to continue`,
        });
      }
      return z.boolean().optional();
    }
    case "number": {
      let n = z.coerce.number();
      if (v.min !== undefined) n = n.min(v.min, `${label} must be at least ${v.min}`);
      if (v.max !== undefined) n = n.max(v.max, `${label} must be at most ${v.max}`);
      if (!field.required) {
        return z.preprocess(
          (val) => (val === "" || val === undefined || val === null ? undefined : val),
          n.optional(),
        );
      }
      return z.preprocess((val) => (val === "" ? Number.NaN : val), n);
    }
    case "textarea":
    case "text":
    default: {
      let s = z.string();
      if (v.minLength) s = s.min(v.minLength, `${label} must be at least ${v.minLength} characters`);
      if (v.maxLength) s = s.max(v.maxLength, `${label} must be at most ${v.maxLength} characters`);
      if (v.pattern) {
        s = s.regex(new RegExp(v.pattern), v.patternMessage ?? `${label} is not in the expected format`);
      }
      return wrapRequired(s, field, label);
    }
  }
}

/** Apply required/optional semantics to string-ish schemas. */
function wrapRequired(
  inner: z.ZodString,
  field: FormFieldDef,
  label: string,
): z.ZodTypeAny {
  if (field.required) {
    // Empty/missing input must fail with a friendly message even when no other rule catches it.
    return z.preprocess(
      normalizeEmpty,
      z.string().min(1, `${label} is required`).pipe(inner),
    );
  }
  return z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    inner.optional(),
  );
}

/**
 * Build the applicant-data zod schema from a StateConfig's formFields.
 * Conditional fields are validated only when their condition is met.
 */
export function buildApplicantSchema(
  config: StateConfig,
): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of config.formFields) {
    shape[field.name] = field.conditional
      ? z.unknown().optional() // validated in superRefine below when visible
      : buildFieldSchema(field);
  }

  return z
    .object(shape)
    .passthrough()
    .superRefine((values, ctx) => {
      const record = values as Record<string, unknown>;
      for (const field of config.formFields) {
        if (!field.conditional) continue;
        if (!isFieldVisible(field, record)) continue;
        const result = buildFieldSchema(field).safeParse(record[field.name]);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({ code: "custom", path: [field.name], message: issue.message });
          }
        }
      }
    }) as unknown as z.ZodType<Record<string, unknown>>;
}

/** The three legally required consents. */
export const consentsSchema = z.object({
  accurate: z.literal(true, { error: "You must confirm your information is accurate" }),
  purchaseAuthorized: z.literal(true, {
    error: "You must authorize AnglerPermit to purchase the license on your behalf",
  }),
  termsAccepted: z.literal(true, {
    error: "You must agree to the Terms of Service and Privacy Policy",
  }),
});

export type Consents = z.infer<typeof consentsSchema>;

/** Full submission schema for a known state (used by the API route and the form). */
export function buildSubmissionSchema(config: StateConfig) {
  const residencyValues = config.residencyOptions.map((r) => r.value);
  const licenseIds = config.licenses.map((l) => l.id);
  const addOnIds = config.addOns.map((a) => a.id);

  return z.object({
    stateSlug: z.literal(config.slug),
    residency: z
      .string()
      .min(1, "Select your residency status")
      .refine((val) => residencyValues.includes(val), {
        message: "Select a valid residency status",
      }),
    licenseId: z
      .string()
      .min(1, "Select a license")
      .refine((val) => licenseIds.includes(val), { message: "Select a valid license" }),
    addOnIds: z
      .array(z.string())
      .refine((ids) => ids.every((id) => addOnIds.includes(id)), {
        message: "One or more add-ons are not valid for this state",
      })
      .default([]),
    data: buildApplicantSchema(config),
    consents: consentsSchema,
  });
}

export type Submission = z.infer<ReturnType<typeof buildSubmissionSchema>>;

/**
 * Generic fallback schema used by the API route when a state config file
 * does not exist yet (pre-Phase-B) — keeps the endpoint functional.
 */
export const genericSubmissionSchema = z.object({
  stateSlug: z.string().min(1),
  residency: z.string().min(1, "Select your residency status"),
  licenseId: z.string().min(1, "Select a license"),
  addOnIds: z.array(z.string()).default([]),
  data: z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      dob: z.string().min(1, "Date of birth is required"),
      email: z.string().email("Enter a valid email address"),
      phone: z.string().min(1, "Phone number is required"),
      address: z.string().min(1, "Address is required"),
      city: z.string().min(1, "City is required"),
      zip: z.string().regex(ZIP_PATTERN, "Enter a valid ZIP code"),
    })
    .passthrough(),
  consents: consentsSchema,
});

export type GenericSubmission = z.infer<typeof genericSubmissionSchema>;

/* ------------------------------------------------------------------ */
/* SSN masking utilities                                               */
/* ------------------------------------------------------------------ */

/** '123-45-6789' -> '***-**-6789'. Anything unrecognized becomes '***-**-****'. */
export function maskSSN(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 9) return `***-**-${digits.slice(5)}`;
  return "***-**-****";
}

/**
 * Return a copy of applicant data with every SSN-typed field masked.
 * Use before logging or emailing. Storage adapters must encrypt at rest.
 */
export function maskSensitiveFields(
  config: StateConfig | null,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...data };
  if (config) {
    for (const field of config.formFields) {
      if (field.type === "ssn" && masked[field.name] !== undefined) {
        masked[field.name] = maskSSN(masked[field.name]);
      }
    }
  } else {
    for (const key of Object.keys(masked)) {
      if (/ssn|social/i.test(key)) masked[key] = maskSSN(masked[key]);
    }
  }
  return masked;
}
