import type { StateConfig } from "@/lib/state-config";

/**
 * CALIFORNIA — typed StateConfig converted from /research/california.json.
 * Source: CDFW Online License Sales and Services + wildlife.ca.gov (2026 fees,
 * verified 2026-07-18). Every license, validation/report card (addOns), price,
 * field, option, conditional, and officialNote/TODO is preserved from the JSON.
 * The JSON's top-level `sources` array is folded into `researchNotes` below
 * (StateConfig has no `sources` field). All enum values were already in-union;
 * no out-of-union type mapping was required.
 */
export const config: StateConfig = {
  slug: "california",
  stateName: "California",
  officialAgencyName: "California Department of Fish and Wildlife",
  officialPortalName: "CDFW Online License Sales and Services",
  officialPortalUrl: "https://www.licenses.wildlife.ca.gov/internetsales/",
  lastVerified: "2026-07-18",
  requiresSSN: false,
  residencyOptions: [
    {
      value: "resident",
      label: "California Resident"
    },
    {
      value: "nonresident",
      label: "Nonresident"
    }
  ],
  licenseYearNote: "Annual '365-Day' sport fishing licenses are valid 365 days from the date of purchase (NOT calendar year, since Jan 1, 2023 per AB 817). Short-term licenses are valid for the specified day(s). Report cards keep season/calendar-based validity. A resident is any person who has resided continuously in California for 6+ months immediately prior to application, any person on active military duty (US Armed Forces or auxiliary), or any Job Corps enrollee (FGC Section 70).",
  licenses: [
    {
      id: "resident-sport-fishing-365-day",
      name: "Resident Sport Fishing",
      price: 64.54,
      residency: "resident",
      duration: "365-Day",
      category: "all-water",
      description: "Available for any resident 16 years of age or older. Valid for 365 days from the date of purchase. Covers inland and ocean waters.",
      suggestedAddOns: [
        "second-rod-validation",
        "ocean-enhancement-validation"
      ]
    },
    {
      id: "nonresident-sport-fishing-365-day",
      name: "Nonresident Sport Fishing",
      price: 174.14,
      residency: "nonresident",
      duration: "365-Day",
      category: "all-water",
      description: "Available for any non-resident 16 years of age or older. Valid for 365 days from the date of purchase. Covers inland and ocean waters.",
      suggestedAddOns: [
        "second-rod-validation",
        "ocean-enhancement-validation"
      ]
    },
    {
      id: "one-day-sport-fishing-license",
      name: "One-day Sport Fishing License",
      price: 21.09,
      residency: "any",
      duration: "1-Day",
      category: "all-water",
      description: "Allows a resident or nonresident to fish for one specified day. One-day sport fishing licenses are exempt from the Ocean Enhancement Validation requirement.",
      suggestedAddOns: [
        "second-rod-validation"
      ]
    },
    {
      id: "two-day-sport-fishing-license",
      name: "Two-day Sport Fishing License",
      price: 32.4,
      residency: "any",
      duration: "2-Day",
      category: "all-water",
      description: "Allows a resident or nonresident to fish for two consecutive days. Two-day sport fishing licenses are exempt from the Ocean Enhancement Validation requirement.",
      suggestedAddOns: [
        "second-rod-validation"
      ]
    },
    {
      id: "ten-day-nonresident-sport-fishing-license",
      name: "Ten-day Nonresident Sport Fishing License",
      price: 64.54,
      residency: "nonresident",
      duration: "10-Day",
      category: "all-water",
      description: "Allows a nonresident to fish for ten consecutive days.",
      suggestedAddOns: [
        "second-rod-validation",
        "ocean-enhancement-validation"
      ]
    },
    {
      id: "reduced-fee-sport-fishing-disabled-veteran",
      name: "Reduced-Fee Sport Fishing License - Disabled Veteran",
      price: 10.54,
      residency: "any",
      duration: "365-Day",
      category: "all-water",
      description: "Available for any resident or nonresident honorably discharged disabled veteran with a 50 percent or greater service-connected disability. Prequalification with CDFW required before first purchase. 2026 fee: $10.04 at CDFW Offices / $10.54 from License Agents.",
      officialNote: "Price shown is the license-agent channel price ($10.54); CDFW office price is $10.04. Requires prequalification (VA letter). Verify channel pricing — https://wildlife.ca.gov/Licensing/Fishing"
    },
    {
      id: "reduced-fee-sport-fishing-recovering-service-member",
      name: "Reduced-Fee Sport Fishing License - Recovering Service Member",
      price: 10.54,
      residency: "any",
      duration: "365-Day",
      category: "all-water",
      description: "Available for any recovering service member of the US military (outpatient status recovering from serious injury or illness related to military service). Prequalification with CDFW required. 2026 fee: $10.04 at CDFW Offices / $10.54 from License Agents.",
      officialNote: "Price shown is the license-agent channel price ($10.54); CDFW office price is $10.04. Requires prequalification (letter from commanding officer or military doctor). Verify — https://wildlife.ca.gov/Licensing/Fishing"
    },
    {
      id: "reduced-fee-sport-fishing-low-income-senior",
      name: "Reduced Fee Sport Fishing License - Low Income Senior",
      price: 10.04,
      residency: "senior",
      duration: "365-Day",
      category: "all-water",
      description: "Available for California residents 65 years of age and older who receive Supplemental Security Income (SSI) or Cash Assistance Program for Aged, Blind, and Disabled Legal Immigrants (CAPI). Only available at CDFW License Sales Offices; SSI/CAPI verification required annually.",
      officialNote: "CDFW License Sales Offices only (not sold online). Verify — https://wildlife.ca.gov/Licensing/Fishing"
    },
    {
      id: "free-sport-fishing-low-income-native-american",
      name: "Free Sport Fishing License - Low Income Native American",
      price: 0,
      residency: "resident",
      duration: "365-Day",
      category: "all-water",
      description: "Available for any Native American who is a resident of the State and is financially unable to pay the fee required for a resident sport fishing license. First license must be obtained from the CDFW License and Revenue Branch; subsequent licenses may be obtained from a CDFW License Sales Office or online."
    },
    {
      id: "free-sport-fishing-mobility-impaired-blind-developmentally-disabled",
      name: "Free Sport Fishing License - Mobility Impaired, Blind or Developmentally Disabled",
      price: 0,
      residency: "any",
      duration: "365-Day",
      category: "all-water",
      description: "Available for a person who is blind, developmentally disabled, or mobility impaired. First Free Sport Fishing License must be obtained from the CDFW License and Revenue Branch; subsequent licenses may be obtained from any license agent. Certification required."
    },
    {
      id: "lifetime-fishing-license-ages-0-9",
      name: "Lifetime Fishing License - Ages 0-9",
      price: 709,
      residency: "resident",
      duration: "Lifetime",
      category: "all-water",
      description: "Available to residents of California. Lifetime fishing licenses are valid for 365 days from the date of issuance and are reissued annually for life. Lifetime Fishing Packages must first be purchased from a CDFW License Sales Office.",
      officialNote: "Sold at CDFW License Sales Offices only (not online). Verify — https://wildlife.ca.gov/Licensing/Lifetime"
    },
    {
      id: "lifetime-fishing-license-ages-10-39",
      name: "Lifetime Fishing License - Ages 10-39",
      price: 1160.25,
      residency: "resident",
      duration: "Lifetime",
      category: "all-water",
      description: "Available to residents of California. Lifetime Fishing Packages must first be purchased from a CDFW License Sales Office.",
      officialNote: "Sold at CDFW License Sales Offices only (not online). Verify — https://wildlife.ca.gov/Licensing/Lifetime"
    },
    {
      id: "lifetime-fishing-license-ages-40-61",
      name: "Lifetime Fishing License - Ages 40-61",
      price: 1045,
      residency: "resident",
      duration: "Lifetime",
      category: "all-water",
      description: "Available to residents of California. Lifetime Fishing Packages must first be purchased from a CDFW License Sales Office.",
      officialNote: "Sold at CDFW License Sales Offices only (not online). Verify — https://wildlife.ca.gov/Licensing/Lifetime"
    },
    {
      id: "lifetime-fishing-license-ages-62-plus",
      name: "Lifetime Fishing License - Ages 62+",
      price: 709,
      residency: "resident",
      duration: "Lifetime",
      category: "all-water",
      description: "Available to residents of California. Lifetime Fishing Packages must first be purchased from a CDFW License Sales Office.",
      officialNote: "Sold at CDFW License Sales Offices only (not online). Verify — https://wildlife.ca.gov/Licensing/Lifetime"
    },
    {
      id: "fishing-privilege-package-lifetime",
      name: "Fishing Privilege Package",
      price: 478.75,
      residency: "resident",
      duration: "Lifetime",
      category: "combo",
      description: "Lifetime add-on package that includes a Lifetime Second-Rod Validation, Ocean Enhancement Validation, North Coast Salmon Report Card and Steelhead Report Card. The Second-Rod Validation and Ocean Enhancement Validation are valid for 365 days from the date of issuance. Companion to a Lifetime Fishing License.",
      officialNote: "TODO: verify — package contents/validity wording from https://wildlife.ca.gov/Licensing/Fishing (2026 fee table)"
    }
  ],
  addOns: [
    {
      id: "ocean-enhancement-validation",
      name: "Ocean Enhancement Validation",
      price: 7.3,
      required: false,
      appliesTo: [
        "resident-sport-fishing-365-day",
        "nonresident-sport-fishing-365-day",
        "ten-day-nonresident-sport-fishing-license"
      ],
      description: "Required to fish in ocean waters south of Point Arguello (Santa Barbara County). Not required when fishing under the authority of a One- or Two-Day Sport Fishing License. Valid 365 days from date of purchase."
    },
    {
      id: "second-rod-validation",
      name: "Second Rod Validation",
      price: 20.26,
      required: false,
      description: "Allows a person to fish with two rods or lines in inland waters, except for waters in which only artificial lures or barbless hooks may be used. Not required when fishing in ocean waters (CCR T14 Section 27.00). Valid 365 days from date of purchase."
    },
    {
      id: "recreational-crab-trap-validation",
      name: "Recreational Crab Trap Validation",
      price: 2.98,
      required: false,
      description: "Required for any person taking crabs with crab traps as defined in CCR T14 Section 29.80(c). Not required when taking crabs with hoop nets or crab loop traps. Beginning January 1, 2026, anglers fishing for crabs using crab trap(s) from a Commercial Passenger Fishing Vessel are no longer required to possess this validation."
    },
    {
      id: "sturgeon-fishing-report-card",
      name: "Sturgeon Fishing Report Card",
      price: 8.13,
      required: false,
      description: "Required for any person taking sturgeon (catch-and-release only). New sturgeon regulations effective September 26, 2025 align the card with the fishing season (October-June) instead of the calendar year. The 2026-2027 Sturgeon Fishing Report Card goes on sale August 15, 2026. Required even for license-exempt anglers (under 16, public pier, free fishing days).",
      officialNote: "Fee dropped from $11.06 (2025) to $8.13 with new season-aligned card; 2025-26 season card was issued at NO FEE. Verify current fee at purchase — https://wildlife.ca.gov/Licensing/Fishing"
    },
    {
      id: "north-coast-salmon-report-card",
      name: "North Coast Salmon Report Card",
      price: 9.21,
      required: false,
      description: "Required for any person taking salmon in the Smith River System or Klamath-Trinity River System. Required even for license-exempt anglers. Report harvest online or return card by January 31."
    },
    {
      id: "steelhead-report-card",
      name: "Steelhead Report Card",
      price: 10.29,
      required: false,
      description: "Required for any person taking steelhead in inland waters. Required even for license-exempt anglers. Report harvest online or return card by January 31."
    },
    {
      id: "spiny-lobster-report-card",
      name: "Spiny Lobster Report Card",
      price: 12.7,
      required: false,
      description: "Required for all persons taking spiny lobster; valid for the entire lobster season. Report card holders who fail to return their card or report harvest online by April 30 are assessed a $21.60 non-return fee when purchasing the following season's card. Required even for license-exempt anglers."
    },
    // REMOVED FROM SALE (2026-07-21 audit): Abalone Report Card — the abalone
    // fishery is closed and the card is not purchasable (N/A on the 2026 CDFW
    // fee schedule — https://wildlife.ca.gov/Licensing/Fishing). Re-add only if
    // CDFW reopens the fishery.
  ],
  formFields: [
    {
      name: "dateOfBirth",
      label: "Date of Birth (MM/DD/YYYY):",
      type: "date",
      required: true,
      placeholder: "MM/DD/YYYY",
      helpText: "Enter a date of birth and last name of the individual for whom you wish to purchase a license. All information collected during the registration process is specific to the individual that will be utilizing the license.",
      mask: "dob",
      step: 2,
      officialNote: "Customer Search Criteria (step 1 of GO ID flow) — verified live on portal 2026-07-18"
    },
    {
      name: "lastName",
      label: "Last Name:",
      type: "text",
      required: true,
      helpText: "Do not enter a suffix (Jr, Sr, III, etc.) in the last name field.",
      autocomplete: "family-name",
      step: 2,
      officialNote: "Customer Search Criteria (step 1 of GO ID flow) — verified live on portal 2026-07-18"
    },
    {
      name: "identityType",
      label: "Identity Type",
      type: "select",
      required: true,
      options: [
        {
          value: "go-id",
          label: "GO ID"
        },
        {
          value: "state-id",
          label: "State ID"
        },
        {
          value: "passport",
          label: "Passport"
        },
        {
          value: "green-card",
          label: "Green Card"
        },
        {
          value: "military-id",
          label: "Military ID"
        },
        {
          value: "foreign-government-id",
          label: "Foreign Government ID"
        }
      ],
      helpText: "Acceptable Identity Types: State ID (Driver's License or Identification Card), Passport, Military ID, Green Card, Foreign Government ID. Existing customers may use their GO ID (printed on existing CDFW license above the customer name).",
      step: 2,
      officialNote: "'Select Official Document ID Type' step — verified live on portal 2026-07-18; dropdown placeholder is '[Select One]'"
    },
    {
      name: "idNumber",
      label: "Number:",
      type: "text",
      required: true,
      helpText: "Enter the identity number corresponding to the selected Identity Type.",
      step: 2,
      officialNote: "Label dynamically becomes 'GO ID:' when Identity Type = GO ID; otherwise 'Number:' (portal identitycontrol.js). TODO: verify — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "stateIssued",
      label: "State Issued:",
      type: "select",
      required: true,
      options: [
        {
          value: "AL",
          label: "Alabama"
        },
        {
          value: "AK",
          label: "Alaska"
        },
        {
          value: "AZ",
          label: "Arizona"
        },
        {
          value: "AR",
          label: "Arkansas"
        },
        {
          value: "CA",
          label: "California"
        },
        {
          value: "CO",
          label: "Colorado"
        },
        {
          value: "CT",
          label: "Connecticut"
        },
        {
          value: "DE",
          label: "Delaware"
        },
        {
          value: "DC",
          label: "District of Columbia"
        },
        {
          value: "FL",
          label: "Florida"
        },
        {
          value: "GA",
          label: "Georgia"
        },
        {
          value: "HI",
          label: "Hawaii"
        },
        {
          value: "ID",
          label: "Idaho"
        },
        {
          value: "IL",
          label: "Illinois"
        },
        {
          value: "IN",
          label: "Indiana"
        },
        {
          value: "IA",
          label: "Iowa"
        },
        {
          value: "KS",
          label: "Kansas"
        },
        {
          value: "KY",
          label: "Kentucky"
        },
        {
          value: "LA",
          label: "Louisiana"
        },
        {
          value: "ME",
          label: "Maine"
        },
        {
          value: "MD",
          label: "Maryland"
        },
        {
          value: "MA",
          label: "Massachusetts"
        },
        {
          value: "MI",
          label: "Michigan"
        },
        {
          value: "MN",
          label: "Minnesota"
        },
        {
          value: "MS",
          label: "Mississippi"
        },
        {
          value: "MO",
          label: "Missouri"
        },
        {
          value: "MT",
          label: "Montana"
        },
        {
          value: "NE",
          label: "Nebraska"
        },
        {
          value: "NV",
          label: "Nevada"
        },
        {
          value: "NH",
          label: "New Hampshire"
        },
        {
          value: "NJ",
          label: "New Jersey"
        },
        {
          value: "NM",
          label: "New Mexico"
        },
        {
          value: "NY",
          label: "New York"
        },
        {
          value: "NC",
          label: "North Carolina"
        },
        {
          value: "ND",
          label: "North Dakota"
        },
        {
          value: "OH",
          label: "Ohio"
        },
        {
          value: "OK",
          label: "Oklahoma"
        },
        {
          value: "OR",
          label: "Oregon"
        },
        {
          value: "PA",
          label: "Pennsylvania"
        },
        {
          value: "RI",
          label: "Rhode Island"
        },
        {
          value: "SC",
          label: "South Carolina"
        },
        {
          value: "SD",
          label: "South Dakota"
        },
        {
          value: "TN",
          label: "Tennessee"
        },
        {
          value: "TX",
          label: "Texas"
        },
        {
          value: "UT",
          label: "Utah"
        },
        {
          value: "VT",
          label: "Vermont"
        },
        {
          value: "VA",
          label: "Virginia"
        },
        {
          value: "WA",
          label: "Washington"
        },
        {
          value: "WV",
          label: "West Virginia"
        },
        {
          value: "WI",
          label: "Wisconsin"
        },
        {
          value: "WY",
          label: "Wyoming"
        }
      ],
      conditional: {
        field: "identityType",
        equals: "state-id"
      },
      step: 2,
      officialNote: "Shown for State ID identity type (portal identitycontrol.js + indexed portal text). Option list is the standard 50 states + DC — TODO: verify exact portal list (may include US territories) — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "countryIssued",
      label: "Country Issued:",
      type: "text",
      required: true,
      conditional: {
        field: "identityType",
        oneOf: [
          "passport",
          "green-card",
          "military-id",
          "foreign-government-id"
        ]
      },
      step: 2,
      officialNote: "Official control is a COUNTRY DROPDOWN (populated via Address/FindCountries per portal identitycontrol.js); rendered as text here because the exact option list is unverified. TODO: verify option list — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "youthFirstName",
      label: "Youth's First Name:",
      type: "text",
      required: true,
      conditional: {
        field: "dateOfBirth",
        equals: "__under18__"
      },
      step: 2,
      officialNote: "Youth (under 18) flow only. Conditional marker '__under18__' = show when applicant DOB is under 18 (portal swaps to youth identification section). TODO: verify — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "identificationOwner",
      label: "Identification Owner:",
      type: "radio",
      required: true,
      options: [
        {
          value: "youth",
          label: "Youth Identification"
        },
        {
          value: "parent-guardian",
          label: "Parent/Guardian Identification"
        }
      ],
      helpText: "Youth Identification: the youth has their own government issued identification or an existing GO ID. Parent/Guardian Identification: the youth does not have their own government issued identification. Youth customers that use a Parent/Guardian Identification will be prompted to update their customer record with their own Acceptable Identity Type when they turn 18 years of age.",
      conditional: {
        field: "dateOfBirth",
        equals: "__under18__"
      },
      step: 2,
      officialNote: "Youth (under 18) flow only. TODO: verify control type (radio vs dropdown) — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "firstName",
      label: "First Name:",
      type: "text",
      required: true,
      autocomplete: "given-name",
      step: 2,
      officialNote: "TODO: verify exact label on Create New Customer Record form — CDFW FAQ confirms 'name' is required (https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions); create form is session-gated at https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "middleName",
      label: "Middle Name:",
      type: "text",
      required: false,
      autocomplete: "additional-name",
      step: 2,
      officialNote: "TODO: verify presence/label on Create New Customer Record form — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "suffix",
      label: "Suffix:",
      type: "text",
      required: false,
      autocomplete: "honorific-suffix",
      step: 2,
      officialNote: "TODO: verify presence/label — portal instructs not to enter suffix in the Last Name field, implying a separate suffix element — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "gender",
      label: "Gender:",
      type: "select",
      required: true,
      options: [
        {
          value: "male",
          label: "Male"
        },
        {
          value: "female",
          label: "Female"
        }
      ],
      step: 2,
      officialNote: "Present in CDFW Customer Profile Info ('Gender: F') — https://wildlife.ca.gov/Hunter-Education/GetGOID. TODO: verify exact option list/labels on create form"
    },
    {
      name: "height",
      label: "Height:",
      type: "text",
      required: true,
      placeholder: "6' 0\"",
      helpText: "Height in feet and inches.",
      step: 2,
      officialNote: "Required per CDFW FAQ; Customer Profile displays format 6' 0\". TODO: verify whether portal uses separate feet/inches inputs — https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions"
    },
    {
      name: "weight",
      label: "Weight:",
      type: "number",
      required: true,
      helpText: "Weight in pounds.",
      validation: {
        min: 1,
        max: 999
      },
      step: 2,
      officialNote: "Required per CDFW FAQ; profile displays numeric pounds (e.g., 135) — https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions"
    },
    {
      name: "eyeColor",
      label: "Eye Color:",
      type: "text",
      required: true,
      step: 2,
      officialNote: "Official control is a DROPDOWN (profile example value 'Blue'); rendered as text here because the exact option list is unverified. Required per CDFW FAQ. TODO: verify dropdown options — https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions"
    },
    {
      name: "hairColor",
      label: "Hair Color:",
      type: "text",
      required: true,
      step: 2,
      officialNote: "Official control is a DROPDOWN (profile example value 'Grey'); rendered as text here because the exact option list is unverified. Required per CDFW FAQ. TODO: verify dropdown options — https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions"
    },
    {
      name: "residency",
      label: "Residency:",
      type: "select",
      required: true,
      options: [
        {
          value: "resident",
          label: "California Resident"
        },
        {
          value: "nonresident",
          label: "Nonresident"
        },
        {
          value: "active-military",
          label: "Active Military"
        },
        {
          value: "job-corps",
          label: "Job Corps"
        }
      ],
      helpText: "A resident is any person who has resided continuously in the State of California for six months or more immediately prior to the date of application, any person on active military duty with the Armed Forces of the United States or auxiliary branch thereof, or any person enrolled in the Job Corps.",
      step: 2,
      officialNote: "CDFW FAQ confirms 'residency status' is required; 'Active Military' is an observed value in Customer Profile Info (https://wildlife.ca.gov/Hunter-Education/GetGOID). TODO: verify exact option labels — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "country",
      label: "Country:",
      type: "text",
      required: true,
      placeholder: "United States",
      autocomplete: "country-name",
      step: 2,
      officialNote: "Official control is a COUNTRY DROPDOWN defaulting to United States (populated via Address/FindCountries); rendered as text here because the option list is data-driven/unverified. Switching country toggles US ZIP/City/State vs International Province (portal Bootstrap-AddressControl.js). TODO: verify exact label — https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin"
    },
    {
      name: "address",
      label: "Address:",
      type: "text",
      required: true,
      autocomplete: "street-address",
      step: 2,
      officialNote: "TODO: verify exact label on Create New Customer Record form — CDFW FAQ confirms 'residence address' is required — https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions"
    },
    {
      name: "zipCode",
      label: "Zip Code:",
      type: "zip",
      required: true,
      helpText: "Entering a valid ZIP code auto-populates City and State. Shown for United States addresses.",
      mask: "zip",
      autocomplete: "postal-code",
      validation: {
        pattern: "^\\d{5}(-\\d{4})?$",
        patternMessage: "Enter a valid 5-digit ZIP code"
      },
      conditional: {
        field: "country",
        equals: "us"
      },
      step: 2,
      officialNote: "ZIP drives City dropdown + State auto-fill via Address/FindCities (portal Bootstrap-AddressControl.js). TODO: verify exact label"
    },
    {
      name: "city",
      label: "City:",
      type: "text",
      required: true,
      autocomplete: "address-level2",
      conditional: {
        field: "country",
        equals: "us"
      },
      step: 2,
      officialNote: "Official control is a DROPDOWN populated from the entered ZIP code via Address/FindCities (portal Bootstrap-AddressControl.js); rendered as text here because option values are data-driven. TODO: verify exact label"
    },
    {
      name: "state",
      label: "State:",
      type: "text",
      required: true,
      autocomplete: "address-level1",
      conditional: {
        field: "country",
        equals: "us"
      },
      step: 2,
      officialNote: "State abbreviation auto-fills from ZIP code (portal Bootstrap-AddressControl.js). TODO: verify exact label and whether read-only"
    },
    {
      name: "internationalProvince",
      label: "International Province:",
      type: "text",
      required: true,
      conditional: {
        field: "country",
        equals: "__not-us__"
      },
      step: 2,
      officialNote: "Shown when Country is not United States (replaces ZIP/City/State; model field 'InternationalProvince' in portal Bootstrap-AddressControl.js). Conditional marker '__not-us__' = show when country is not US. TODO: verify exact label"
    },
    {
      name: "phone",
      label: "Phone Number:",
      type: "tel",
      required: true,
      helpText: "Anglers are required to provide their telephone number when purchasing a sport fishing license. Collection of telephone numbers allows California to comply with a federal mandate for purposes of establishing a National Saltwater Angler Registry (CCR Title 14, Section 700.3).",
      mask: "phone",
      autocomplete: "tel",
      step: 2,
      officialNote: "Required by CCR T14 Section 700.3 (National Saltwater Angler Registry) per California Ocean Sport Fishing Regulations. TODO: verify exact label on create form"
    },
    {
      name: "email",
      label: "Email Address:",
      type: "email",
      required: false,
      helpText: "Optional. Used for purchase confirmation emails and required if enrolling in Auto-Renewal. CDFW will not share customer contact information with outside entities pursuant to Fish and Game Code 1050.6.",
      autocomplete: "email",
      step: 2,
      officialNote: "CDFW FAQ: email optional at checkout for confirmation; required for Auto-Renewal enrollment. TODO: verify exact label on create form"
    },
    {
      name: "emailPreference",
      label: "Email Preferences",
      type: "radio",
      required: false,
      options: [
        {
          value: "all",
          label: "Send me all email updates"
        },
        {
          value: "news-only",
          label: "Send me only CDFW News"
        },
        {
          value: "reminders-only",
          label: "Send me only CDFW Licensing Reminders"
        },
        {
          value: "none",
          label: "Unsubscribe from all emails"
        }
      ],
      step: 2,
      officialNote: "Options verified on CDFW Contact Preferences page (2022 archived). Placement during initial registration vs post-registration TODO: verify — https://www.licenses.wildlife.ca.gov/internetsales/"
    },
    {
      name: "allowTextMessages",
      label: "Allow text messages for the above CDFW communications.",
      type: "checkbox",
      required: false,
      step: 2,
      officialNote: "Verified on CDFW Contact Preferences page (2022 archived). Placement TODO: verify — https://www.licenses.wildlife.ca.gov/internetsales/"
    },
    {
      name: "password",
      label: "Password:",
      type: "text",
      required: false,
      helpText: "Optional password protects your customer record and is required to enroll in Auto-Renewal and to access certain customer-record features (e.g., Upload File).",
      step: 2,
      officialNote: "TODO: verify label, rules and placement — see 'Password Protection (through Customer Record Security Settings)' at https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions"
    }
  ],
  stateIdentifiers: [
    {
      name: "goId",
      label: "GO ID (Get Outdoors Identification)",
      helpText: "Every customer purchasing a California fishing or hunting license, permits, or annual passes must create a customer record and obtain a Get Outdoors Identification (GO ID) number. Your GO ID prints on all your licenses and is used to track purchases, preference points, and harvest reporting requirements. Existing customers retrieve their record with GO ID + date of birth + last name.",
      required: true
    }
  ],
  consentExtra: "All sales are final. There are no refunds or exchanges. Licenses, tags, and report cards must be in possession to perform the applicable activity. Report cards, tags, and waterfowl passes are mail-fulfilled only (allow at least 15 days). FGC Section 1050.6 and California Government Code Section 11015.5 prohibit CDFW from selling or sharing your personal information with any third party. Telephone number is required under CCR Title 14, Section 700.3 for the National Saltwater Angler Registry.",
  researchNotes: "Prices are the official CDFW 2026 fees from https://wildlife.ca.gov/Licensing/Fishing (verified 2026-07-18); most fees include a 5% license agent handling fee and 3% nonrefundable application fee. California has NO calendar-year annual license: annual = 365 days from date of purchase (AB 817, effective Jan 1, 2023). California does NOT request SSN for sport fishing licenses (verified against CDFW online-sales FAQ and the live registration flow). The Create New Customer Record form sits behind bot protection + session state on the live portal; fields marked 'TODO: verify' were corroborated via the CDFW FAQ, the official Customer Profile Info screenshot, portal JavaScript (identitycontrol.js, Bootstrap-AddressControl.js) and the live Customer Search / identity-type steps, but their exact labels on the create form could not be rendered during this session.\n\nSources:\n- https://wildlife.ca.gov/Licensing/Fishing\n- https://www.licenses.wildlife.ca.gov/internetsales/\n- https://www.licenses.wildlife.ca.gov/internetsales/customersearch/begin\n- https://wildlife.ca.gov/Licensing/Online-Sales/Frequently-Asked-Questions\n- https://wildlife.ca.gov/Hunter-Education/GetGOID\n- https://www.eregulations.com/california/fishing/freshwater-sport-fishing-license-fees\n- https://web.archive.org/web/20241112055129id_/https://www.ca.wildlifelicense.com/internetsales/Scripts/identitycontrol.js\n- https://web.archive.org/web/20241112055131id_/https://www.ca.wildlifelicense.com/internetsales/Scripts/Bootstrap-AddressControl.js\n- https://web.archive.org/web/20220610161850id_/https://www.ca.wildlifelicense.com/InternetSales/contactpreferences/4313079A0CD44AEBBC28AA6B74480A2520220525\n- https://web.archive.org/web/20250523105507id_/https://www.licenses.wildlife.ca.gov/internetsales/Sales/ItemSelection\n- https://wildlife.ca.gov/News/Archive/white-sturgeon-opener-kicks-off-with-a-no-fee-report-card-for-this-season\n- https://vandenberg.isportsman.net/files/2025%20Ocean%20Sport%20Fish_JulyUpdate070225.pdf"
};

export default config;
