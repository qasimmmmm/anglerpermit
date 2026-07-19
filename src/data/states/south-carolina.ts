import type { FieldOption, StateConfig } from "@/lib/state-config";

/**
 * SOUTH CAROLINA — Go Outdoors South Carolina / SCDNR.
 * Source: /mnt/agents/output/research/south-carolina.json (fees effective
 * July 1, 2025 – June 30, 2026; verified 2026-07-18). Every license, add-on,
 * price, field, option, and officialNote/TODO from the research is preserved.
 *
 * TYPE-MAPPING DECISIONS (shared-contract adaptations; no data dropped):
 *  1. License residency "youth"/"senior" -> "resident" (4 licenses). The
 *     residencyOptions below mirror the official portal's Resident/Non-Resident
 *     toggle exactly, and licensesForResidency() only matches "any" or the
 *     selected option — "youth"/"senior" would hide these resident-only
 *     products from every applicant. All four are SC-resident-only per
 *     research; the age tier stays in the description/officialNote.
 *  2. hard-card add-on: research appliesTo: [] -> omitted. The contract's
 *     addOnsForLicense() treats an empty array as "applies to none" and an
 *     omitted appliesTo as "applies to all"; research intent is "offered with
 *     licenses" generally.
 *  3. Selects whose official option list is not observable (portal enrollment
 *     is behind Cloudflare CAPTCHA) and inventing options is prohibited:
 *       - gender, race, scCounty -> type "text" (a required select with zero
 *         options would make the wizard impossible to complete).
 *       - The four State dropdowns keep type "select" with the standard
 *         50-state + DC list, per the research directive on homeState
 *         ("Use standard 50-state + DC list").
 *  4. Conditionals referencing wizard-level values dropped (documented inline):
 *     ConditionalRule can only reference other applicant-data fields
 *     (isFieldVisible is evaluated against `data` only), so
 *     { field: "residency", ... } and { field: "licenseCategory", ... } could
 *     never fire and would permanently hide + never validate those fields.
 *  5. Research `validation` blocks on ssn/tel/zip fields are preserved
 *     verbatim for provenance; the shared buildFieldSchema() enforces its own
 *     masked patterns for those FieldTypes (SSN XXX-XX-XXXX, phone
 *     (555) 123-4567, ZIP 12345[-6789]) which the input masks produce.
 */

/** Standard 50-state + DC list (research directive for the State dropdowns). */
const US_STATES: FieldOption[] = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export const config: StateConfig = {
  slug: "south-carolina",
  stateName: "South Carolina",
  officialAgencyName: "South Carolina Department of Natural Resources",
  officialPortalName: "Go Outdoors South Carolina",
  officialPortalUrl: "https://gooutdoorssouthcarolina.com/",
  lastVerified: "2026-07-18",
  requiresSSN: true,
  ssnExplainer:
    "South Carolina law (S.C. Code Section 63-17-1080) and federal law (42 USCA 666(a)(13)) require disclosure of your Social Security Number or alien identification number to obtain SC hunting and fishing licenses; it is provided to the Child Support Enforcement Unit of the SC Department of Social Services. First-time purchasers must provide their full SSN. International customers may purchase with a passport instead of an SSN (nonresident fees apply).",
  residencyOptions: [
    { value: "resident", label: "South Carolina Resident" },
    { value: "nonresident", label: "Non-Resident" },
  ],
  licenseYearNote:
    "Annual recreational hunting and fishing licenses are valid 1 year from date of purchase; 3-year licenses are valid 3 years from date of purchase (anniversary-based, no fixed license year). 14-day / 7-day / 1-day licenses are valid for consecutive days. Nongame fish tags, shrimp baiting licenses, and commercial licenses expire June 30 each year.",
  licenses: [
    {
      id: "freshwater-fishing-license-annual-res",
      name: "Freshwater Fishing License",
      price: 10,
      residency: "resident",
      duration: "Annual",
      category: "freshwater",
      description:
        "Valid 1 year from date of purchase. Required to fish freshwater for anyone 16+ (not required in privately-owned ponds).",
      suggestedAddOns: ["jug-permit-res", "set-hook-permit-res", "trotline-tag-res"],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and eregulations.com/southcarolina/fishing/licenses-fees (fees effective July 1, 2025 - June 30, 2026).",
    },
    {
      id: "freshwater-fishing-license-3-year-res",
      name: "Freshwater Fishing License",
      price: 30,
      residency: "resident",
      duration: "3-Year",
      category: "freshwater",
      description:
        "Valid 3 years from date of purchase. Requires 180 days of SC residency to qualify (3-year licenses).",
      suggestedAddOns: ["jug-permit-res", "set-hook-permit-res", "trotline-tag-res"],
      officialNote:
        "Verified on dnr.sc.gov and eregulations.com. Residency duration per dnr.sc.gov/licenses/pricingresident.html.",
    },
    {
      id: "freshwater-fishing-license-14-day-res",
      name: "Freshwater Fishing License",
      price: 5,
      residency: "resident",
      duration: "14-Day",
      category: "freshwater",
      description: "Valid 14 consecutive days.",
      suggestedAddOns: [],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "freshwater-fishing-license-annual-nonres",
      name: "Freshwater Fishing License",
      price: 35,
      residency: "nonresident",
      duration: "Annual",
      category: "freshwater",
      description:
        "Valid 1 year from date of purchase. Required for nonresidents 16+ to fish freshwater.",
      suggestedAddOns: ["jug-permit-nonres", "set-hook-permit-nonres", "trotline-tag-nonres"],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingnonresident.html and eregulations.com.",
    },
    {
      id: "freshwater-fishing-license-3-year-nonres",
      name: "Freshwater Fishing License",
      price: 105,
      residency: "nonresident",
      duration: "3-Year",
      category: "freshwater",
      description: "Valid 3 years from date of purchase.",
      suggestedAddOns: ["jug-permit-nonres", "set-hook-permit-nonres", "trotline-tag-nonres"],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "freshwater-fishing-license-14-day-nonres",
      name: "Freshwater Fishing License",
      price: 11,
      residency: "nonresident",
      duration: "14-Day",
      category: "freshwater",
      description: "Valid 14 consecutive days.",
      suggestedAddOns: [],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "saltwater-fishing-license-annual-res",
      name: "Saltwater Fishing License",
      price: 15,
      residency: "resident",
      duration: "Annual",
      category: "saltwater",
      description:
        "Valid 1 year from date of purchase. Required when harvesting marine resources (finfish, oysters, clams, shrimp, crab) unless fishing on a licensed public pier, a licensed charter vessel under hire, or using 3 or fewer drop nets / fold-up traps / handlines.",
      suggestedAddOns: ["recreational-crab-trap-endorsement", "shrimp-baiting-license-tags-res"],
      officialNote:
        "Verified on dnr.sc.gov and eregulations.com ($15 resident annual, current fee schedule).",
    },
    {
      id: "saltwater-fishing-license-3-year-res",
      name: "Saltwater Fishing License",
      price: 45,
      residency: "resident",
      duration: "3-Year",
      category: "saltwater",
      description:
        "Valid 3 years from date of purchase. Resident only - no nonresident 3-year saltwater license is offered.",
      suggestedAddOns: ["recreational-crab-trap-endorsement", "shrimp-baiting-license-tags-res"],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "saltwater-fishing-license-14-day-res",
      name: "Saltwater Fishing License",
      price: 10,
      residency: "resident",
      duration: "14-Day",
      category: "saltwater",
      description:
        "Valid 14 consecutive days. Resident only - nonresidents buy 1-day or 7-day saltwater licenses instead.",
      suggestedAddOns: ["recreational-crab-trap-endorsement"],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "saltwater-fishing-license-annual-nonres",
      name: "Saltwater Fishing License",
      price: 75,
      residency: "nonresident",
      duration: "Annual",
      category: "saltwater",
      description: "Valid 1 year from date of purchase.",
      suggestedAddOns: ["recreational-crab-trap-endorsement", "shrimp-baiting-license-tags-nonres"],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "saltwater-fishing-license-7-day-nonres",
      name: "Saltwater Fishing License",
      price: 35,
      residency: "nonresident",
      duration: "7-Day",
      category: "saltwater",
      description: "Valid 7 consecutive days. Nonresident only.",
      suggestedAddOns: ["recreational-crab-trap-endorsement"],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "saltwater-fishing-license-1-day-nonres",
      name: "Saltwater Fishing License",
      price: 10,
      residency: "nonresident",
      duration: "1-Day",
      category: "saltwater",
      description: "Valid 1 day. Nonresident only.",
      suggestedAddOns: ["recreational-crab-trap-endorsement"],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "combination-license-annual-res",
      name: "Combination License",
      price: 25,
      residency: "resident",
      duration: "Annual",
      category: "combo",
      description:
        "Includes State Hunting, Big Game & Freshwater Fishing. Valid 1 year from date of purchase. Resident only. Hunter education certification required for applicants born after June 30, 1979.",
      suggestedAddOns: [],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "combination-license-3-year-res",
      name: "Combination License",
      price: 75,
      residency: "resident",
      duration: "3-Year",
      category: "combo",
      description:
        "Includes State Hunting, Big Game & Freshwater Fishing. Valid 3 years from date of purchase. Resident only.",
      suggestedAddOns: [],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "sportsman-license-annual-res",
      name: "Sportsman License",
      price: 50,
      residency: "resident",
      duration: "Annual",
      category: "combo",
      description:
        "Includes State Hunting, Big Game, Wildlife Management Areas & Freshwater Fishing. Valid 1 year from date of purchase. Resident only.",
      suggestedAddOns: [],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "sportsman-license-3-year-res",
      name: "Sportsman License",
      price: 150,
      residency: "resident",
      duration: "3-Year",
      category: "combo",
      description:
        "Includes State Hunting, Big Game, Wildlife Management Areas & Freshwater Fishing. Valid 3 years from date of purchase. Resident only.",
      suggestedAddOns: [],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "junior-sportsman-license-annual-res",
      name: "Junior Sportsman License",
      price: 16,
      // TYPE-MAP: research residency "youth" -> "resident". licensesForResidency()
      // only matches the selected residency option ("resident"/"nonresident" per
      // the official portal toggle), so "youth" would hide this resident-only
      // license from everyone. Ages 16-17 tier preserved in the description.
      residency: "resident",
      duration: "Annual",
      category: "combo",
      description:
        "Includes State Hunting, Big Game, Wildlife Management Areas & Freshwater Fishing. For applicants 16-17 years of age; remains valid regardless of age until expiration (1 year from date of purchase). Resident only. Children under 16 need no license.",
      suggestedAddOns: [],
      officialNote: "Verified on dnr.sc.gov and eregulations.com.",
    },
    {
      id: "senior-fishing-license-lifetime",
      name: "Senior Fishing License",
      price: 9,
      // TYPE-MAP: research residency "senior" -> "resident" (same filtering
      // constraint as above; this is an SC-resident-only product, age 64+).
      residency: "resident",
      duration: "Lifetime",
      category: "all-water",
      description:
        "Lifetime license for SC residents age 64+ (date of birth July 1, 1940 or later; 180-day residency required). Fishing privileges: Freshwater Fishing, Freshwater Set Hook, Saltwater Fishing. Available only by mail or in person at SCDNR offices - NOT sold in the online flow.",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and official Lifetime License application. Mail/in-person only.",
    },
    {
      id: "senior-combination-license-lifetime",
      name: "Senior Combination License",
      price: 9,
      // TYPE-MAP: research residency "senior" -> "resident" (see above).
      residency: "resident",
      duration: "Lifetime",
      category: "combo",
      description:
        "Lifetime license for SC residents age 64+ (date of birth July 1, 1940 or later; 180-day residency required). Combination privileges: Freshwater Fishing, Freshwater Set Hook, Saltwater Fishing, State Hunting, Big Game, WMA, Migratory Waterfowl. Mail/in-person only.",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and official Lifetime License application. Mail/in-person only.",
    },
    {
      id: "gratis-license-lifetime",
      name: "Gratis License",
      price: 0,
      // TYPE-MAP: research residency "senior" -> "resident" (see above).
      residency: "resident",
      duration: "Lifetime",
      category: "combo",
      description:
        "No-cost lifetime license available only to SC residents born on or before July 1, 1940. Includes Freshwater Fishing, Freshwater Set Hook, Saltwater Fishing, State Hunting, Big Game, WMA, Migratory Waterfowl. Mail/in-person only.",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html. Mail/in-person only.",
    },
    {
      id: "disability-fishing-license-3-year",
      name: "Disability Fishing License",
      price: 0,
      residency: "resident",
      duration: "3-Year",
      category: "all-water",
      description:
        "No-cost 3-year license (freshwater fishing + saltwater fishing) for SC residents (365-day residency) receiving disability benefits from SSA, SC Retirement System, Railroad Retirement Board, VA, Federal Civil Service, or Medicaid. Expires on the third anniversary of the date issued. Issued from designated SCDNR offices by application - NOT sold online.",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and S.C. Code 50-9-525. Application only (mail/in-person).",
    },
    {
      id: "disability-combination-license-3-year",
      name: "Disability Combination License",
      price: 0,
      residency: "resident",
      duration: "3-Year",
      category: "combo",
      description:
        "No-cost 3-year license: Freshwater Fishing, Freshwater Set Hook, Saltwater Fishing, State Hunting, Big Game, WMA, Migratory Waterfowl. Same disability/residency qualifications as Disability Fishing License. Application only. Lifetime disability licenses (quadriplegia/paraplegia/legally blind) also no cost per S.C. Code 50-9-525.",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and S.C. Code 50-9-525. Application only (mail/in-person).",
    },
    {
      id: "lifetime-freshwater-fishing-license",
      name: "Lifetime Freshwater Fishing License",
      price: 300,
      residency: "resident",
      duration: "Lifetime",
      category: "freshwater",
      description:
        "Lifetime freshwater fishing license for SC residents age 16-63 (180-day residency required). Available only via the Lifetime Recreational Hunting and Fishing License Application (mail/in-person).",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and official lifetime application. Application only.",
    },
    {
      id: "lifetime-saltwater-fishing-license",
      name: "Lifetime Saltwater Fishing License",
      price: 300,
      residency: "resident",
      duration: "Lifetime",
      category: "saltwater",
      description:
        "Lifetime saltwater fishing license for SC residents age 16-63 (180-day residency required). Application only (mail/in-person).",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and official lifetime application. Application only.",
    },
    {
      id: "lifetime-combination-license",
      name: "Lifetime Combination License",
      price: 500,
      residency: "resident",
      duration: "Lifetime",
      category: "combo",
      description:
        "Lifetime combination (Statewide Hunting, Big Game Permit, Freshwater Fishing) for SC residents age 16-63. Age-tiered pricing: under 2 years $300; 2-15 years $400; 16-63 years $500. Saltwater Fishing License Add-On to Combination License: $120 (under 2), $160 (2-15), $200 (16-63). Migratory Waterfowl Permit Add-On: $66 (under 2), $88 (2-15), $110 (16-63). Application only (mail/in-person).",
      suggestedAddOns: [],
      officialNote:
        "Verified on dnr.sc.gov/licenses/pricingresident.html and official lifetime application. Application only.",
    },
  ],
  addOns: [
    {
      id: "jug-permit-res",
      name: "Jug Permit",
      price: 5,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-res",
        "freshwater-fishing-license-3-year-res",
        "freshwater-fishing-license-14-day-res",
      ],
      description:
        "Annual nongame device permit. 1 permit per licensee; allows up to 50 jugs subject to body of water. Expires June 30 each year. A freshwater fishing license is required to use nongame devices.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Resident price.",
    },
    {
      id: "jug-permit-nonres",
      name: "Jug Permit",
      price: 50,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-nonres",
        "freshwater-fishing-license-3-year-nonres",
        "freshwater-fishing-license-14-day-nonres",
      ],
      description:
        "Annual nongame device permit (nonresident). 1 permit per licensee; up to 50 jugs. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "set-hook-permit-res",
      name: "Set Hook Permit",
      price: 5,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-res",
        "freshwater-fishing-license-3-year-res",
        "freshwater-fishing-license-14-day-res",
      ],
      description:
        "Annual nongame device permit. 1 permit per licensee; allows up to 50 hooks. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Resident price.",
    },
    {
      id: "set-hook-permit-nonres",
      name: "Set Hook Permit",
      price: 50,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-nonres",
        "freshwater-fishing-license-3-year-nonres",
        "freshwater-fishing-license-14-day-nonres",
      ],
      description:
        "Annual nongame device permit (nonresident). Up to 50 hooks. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "trotline-tag-res",
      name: "Trotline Tag",
      price: 2.5,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-res",
        "freshwater-fishing-license-3-year-res",
        "freshwater-fishing-license-14-day-res",
      ],
      description:
        "Annual nongame device tag. Recreational limit is 1 trotline with a maximum 50 hooks. Tag must be secured to the device. Expires June 30 each year.",
      officialNote:
        "Verified $2.50 on dnr.sc.gov/licenses/pricingresident.html and eregulations.com fee table. NOTE: current SCDNR paper tag application (Rev. 05/2025) prints $2.00 - online fee schedule used.",
    },
    {
      id: "trotline-tag-nonres",
      name: "Trotline Tag",
      price: 50,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-nonres",
        "freshwater-fishing-license-3-year-nonres",
        "freshwater-fishing-license-14-day-nonres",
      ],
      description:
        "Annual nongame device tag (nonresident; covers 2 or more trotlines or trotlines with more than 50 hooks). Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "eel-pot-tag-res",
      name: "Eel Pot Tag",
      price: 5,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-res",
        "freshwater-fishing-license-3-year-res",
        "freshwater-fishing-license-14-day-res",
      ],
      description:
        "Annual nongame device tag. Recreational limit 2 pots per licensee; reporting requirements apply. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Resident price.",
    },
    {
      id: "eel-pot-tag-nonres",
      name: "Eel Pot Tag",
      price: 50,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-nonres",
        "freshwater-fishing-license-3-year-nonres",
        "freshwater-fishing-license-14-day-nonres",
      ],
      description:
        "Annual nongame device tag (nonresident). Limit 2 pots; reporting requirements apply. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "gill-net-tag-res",
      name: "Gill Net Tag (Not for Shad or Herring)",
      price: 5,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-res",
        "freshwater-fishing-license-3-year-res",
        "freshwater-fishing-license-14-day-res",
      ],
      description:
        "Annual nongame device tag. Recreational limit 3 nets, no more than 100 yards of net total. Not for shad or herring. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Resident price.",
    },
    {
      id: "gill-net-tag-nonres",
      name: "Gill Net Tag (Not for Shad or Herring)",
      price: 50,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-nonres",
        "freshwater-fishing-license-3-year-nonres",
        "freshwater-fishing-license-14-day-nonres",
      ],
      description:
        "Annual nongame device tag (nonresident). Limit 3 nets / 100 yards total. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "hoop-net-tag-res",
      name: "Hoop Net Tag",
      price: 10,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-res",
        "freshwater-fishing-license-3-year-res",
        "freshwater-fishing-license-14-day-res",
      ],
      description:
        "Annual nongame device tag. dnr.sc.gov resident pricing page: recreational limit 1 net per licensee 65 years and older on the Wateree River only. Expires June 30 each year.",
      officialNote:
        "Verified on dnr.sc.gov and eregulations.com (eregulations note says 'Commercial license required' - discrepancy noted in researchNotes).",
    },
    {
      id: "hoop-net-tag-nonres",
      name: "Hoop Net Tag",
      price: 50,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-nonres",
        "freshwater-fishing-license-3-year-nonres",
        "freshwater-fishing-license-14-day-nonres",
      ],
      description: "Annual nongame device tag (nonresident). Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "trap-tag-res",
      name: "Trap Tag",
      price: 5,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-res",
        "freshwater-fishing-license-3-year-res",
        "freshwater-fishing-license-14-day-res",
      ],
      description:
        "Annual nongame device tag. Recreational limit 2 traps per licensee. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Resident price.",
    },
    {
      id: "trap-tag-nonres",
      name: "Trap Tag",
      price: 50,
      required: false,
      appliesTo: [
        "freshwater-fishing-license-annual-nonres",
        "freshwater-fishing-license-3-year-nonres",
        "freshwater-fishing-license-14-day-nonres",
      ],
      description: "Annual nongame device tag (nonresident). Limit 2 traps. Expires June 30 each year.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "shrimp-baiting-license-tags-res",
      name: "Shrimp Baiting License & Tags",
      price: 25,
      required: false,
      appliesTo: [
        "saltwater-fishing-license-annual-res",
        "saltwater-fishing-license-3-year-res",
        "saltwater-fishing-license-14-day-res",
      ],
      description:
        "Season license and tags required to take shrimp over bait. Season dates apply (typically fall). Tags must be in possession.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Resident price.",
    },
    {
      id: "shrimp-baiting-license-tags-nonres",
      name: "Shrimp Baiting License & Tags",
      price: 500,
      required: false,
      appliesTo: [
        "saltwater-fishing-license-annual-nonres",
        "saltwater-fishing-license-7-day-nonres",
        "saltwater-fishing-license-1-day-nonres",
      ],
      description:
        "Season license and tags (nonresident) required to take shrimp over bait. Season dates apply.",
      officialNote: "Verified on dnr.sc.gov and eregulations.com. Nonresident price.",
    },
    {
      id: "recreational-crab-trap-endorsement",
      name: "Recreational Crab Trap Endorsement",
      price: 5,
      required: false,
      appliesTo: [
        "saltwater-fishing-license-annual-res",
        "saltwater-fishing-license-3-year-res",
        "saltwater-fishing-license-14-day-res",
        "saltwater-fishing-license-annual-nonres",
        "saltwater-fishing-license-7-day-nonres",
        "saltwater-fishing-license-1-day-nonres",
      ],
      description:
        "Annual endorsement; saltwater fishing license holder with this endorsement may fish up to five crab traps per licensee. Same $5 price for residents and nonresidents.",
      officialNote: "Verified on eregulations.com/southcarolina/fishing/licenses-fees.",
    },
    {
      id: "hard-card",
      name: "Hard Card",
      price: 6,
      required: false,
      // TYPE-MAP: research had appliesTo: [] ("offered with licenses" generally).
      // addOnsForLicense() treats [] as "applies to none" and an omitted
      // appliesTo as "applies to all", so appliesTo is omitted to match intent.
      description:
        "Durable credit-card style license card; up to 7 valid annual licenses printed on the card and mailed. Optional add-on offered with licenses (also included in portal 'License Activity Packages').",
      officialNote:
        "TODO: verify - $6.00 price verified on official Lifetime License application ('Optional Hard Card - $6.00 ea.'); annual-license Hard Card price not separately listed - https://gooutdoorssouthcarolina.com/",
    },
  ],
  formFields: [
    {
      name: "customerId",
      label: "Customer #",
      type: "text",
      required: false,
      placeholder: "C",
      helpText:
        "Your SCDNR Customer ID number. Returning customers: it is located in the lower left hand corner of a SCDNR-issued license and begins with 'C'. Leave blank if this is your first purchase - one is created for you.",
      autocomplete: "off",
      validation: { maxLength: 12 },
      step: 2,
      officialNote:
        "Exact label 'Customer #' (pre-filled prefix 'C') from official SCDNR Recreational Hunting and Fishing Tag Application (25-14585 Rev. 05/2025) and dnr.sc.gov/licenses/customerid.html.",
    },
    {
      name: "ssn",
      label: "Social Security #",
      type: "ssn",
      required: true,
      helpText:
        "Required by SC Code Section 63-17-1080 and federal law 42 USCA 666(a)(13) for child support enforcement. First-time purchasers must provide their full SSN; it is not printed on your license. International customers may use a passport / alien identification number instead.",
      mask: "ssn",
      autocomplete: "off",
      // Provenance only: buildFieldSchema() enforces its own masked SSN pattern
      // (XXX-XX-XXXX) for type "ssn"; the ssn input mask produces that format.
      validation: {
        minLength: 9,
        maxLength: 11,
        pattern: "^\\d{3}-?\\d{2}-?\\d{4}$",
        patternMessage: "Enter a valid 9-digit Social Security Number",
      },
      step: 2,
      officialNote:
        "Label and XXX-XX-XXXX format from official SCDNR application. 'Full social security number' required for first-time purchase per dnr.sc.gov/licenses/faqs.html. Portal lookup uses 'Last Four of SSN' for returning customers.",
    },
    {
      name: "dateOfBirth",
      label: "Date of Birth (MM/DD/YYYY)",
      type: "date",
      required: true,
      mask: "dob",
      autocomplete: "bday",
      step: 2,
      officialNote:
        "Exact label from Go Outdoors SC customer lookup/enrollment form (license.gooutdoorssouthcarolina.com/Licensing/CustomerLookup.aspx).",
    },
    {
      name: "firstName",
      label: "First",
      type: "text",
      required: true,
      helpText: "Name as it appears on your SC Driver's License or SCDMV issued ID Card.",
      autocomplete: "given-name",
      validation: { maxLength: 30 },
      step: 2,
      officialNote:
        "Field group label 'Name (as it appears on your SC Driver's License or SCDMV issued ID Card)' with sub-fields First / M Init / Last / Suffix, from official SCDNR application.",
    },
    {
      name: "middleInitial",
      label: "M Init",
      type: "text",
      required: false,
      autocomplete: "additional-name",
      validation: { maxLength: 1 },
      step: 2,
      officialNote: "Exact label from official SCDNR application.",
    },
    {
      name: "lastName",
      label: "Last",
      type: "text",
      required: true,
      autocomplete: "family-name",
      validation: { maxLength: 40 },
      step: 2,
      officialNote: "Official SCDNR application. Portal login labels this 'Customer Last Name'.",
    },
    {
      name: "suffix",
      label: "Suffix (Sr, Jr, III, etc)",
      type: "text",
      required: false,
      autocomplete: "honorific-suffix",
      validation: { maxLength: 10 },
      step: 2,
      officialNote: "Exact label from official SCDNR application.",
    },
    {
      name: "gender",
      label: "Gender",
      // TYPE-MAP: research type "select" -> "text". The official option list is
      // not observable (portal enrollment behind Cloudflare CAPTCHA) and
      // inventing options is prohibited; a required select with zero options
      // would make the wizard impossible to complete.
      type: "text",
      required: true,
      step: 2,
      officialNote:
        "TODO: verify - field appears on official SCDNR paper application; online option list not observable (Go Outdoors SC enrollment is behind Cloudflare CAPTCHA) - https://license.gooutdoorssouthcarolina.com/Licensing/CustomerLookup.aspx",
    },
    {
      name: "race",
      label: "Race",
      // TYPE-MAP: research type "select" -> "text" (same reason as gender).
      type: "text",
      required: true,
      step: 2,
      officialNote:
        "TODO: verify - field appears on official SCDNR paper application; online option list not observable (CAPTCHA) - https://license.gooutdoorssouthcarolina.com/Licensing/CustomerLookup.aspx",
    },
    {
      name: "homeStreet",
      label: "Street",
      type: "text",
      required: true,
      autocomplete: "address-line1",
      validation: { maxLength: 50 },
      step: 2,
      officialNote: "Under 'Home' address group on official SCDNR application.",
    },
    {
      name: "homeCity",
      label: "City",
      type: "text",
      required: true,
      autocomplete: "address-level2",
      validation: { maxLength: 40 },
      step: 2,
      officialNote: "Official SCDNR application (Home address).",
    },
    {
      name: "homeState",
      label: "State",
      type: "select",
      required: true,
      // Options added per the research directive on this field
      // ("Use standard 50-state + DC list"); online list is CAPTCHA-blocked.
      options: US_STATES,
      autocomplete: "address-level1",
      step: 2,
      officialNote:
        "TODO: verify - official application shows 'State' field; exact dropdown option list not observable online (CAPTCHA). Use standard 50-state + DC list.",
    },
    {
      name: "homeZip",
      label: "Zip",
      type: "zip",
      required: true,
      mask: "zip",
      autocomplete: "postal-code",
      validation: { pattern: "^\\d{5}(-\\d{4})?$", patternMessage: "Enter a valid ZIP code" },
      step: 2,
      officialNote: "Exact label 'Zip' from official SCDNR application (Home address).",
    },
    {
      name: "scCounty",
      label: "SC County of Residence",
      // TYPE-MAP 1: research conditional { field: "residency", equals: "resident" }
      // dropped — ConditionalRule is evaluated against applicant-data fields
      // only, and `residency` is a wizard-level value, so the rule could never
      // fire (field permanently hidden + never validated). Rendered always
      // visible; the resident-only requirement is carried in helpText.
      // TYPE-MAP 2: required true -> false — the official form requires this of
      // SC residents only; required-for-all would force nonresidents to enter
      // an SC county.
      // TYPE-MAP 3: research type "select" -> "text" (official 46-county option
      // list not observable; inventing options is prohibited).
      type: "text",
      required: false,
      helpText: "Required for South Carolina residents on the official application.",
      step: 2,
      officialNote:
        "TODO: verify - exact label from official SCDNR application; 46 SC county option list not published on paper form (CAPTCHA-blocked online).",
    },
    {
      name: "mailingStreet",
      label: "Street or PO Box",
      type: "text",
      required: false,
      helpText: "Mailing (only if different from Home address)",
      autocomplete: "off",
      validation: { maxLength: 50 },
      step: 2,
      officialNote:
        "Official SCDNR application: 'Mailing (only if different from Home address)' group.",
    },
    {
      name: "mailingCity",
      label: "City",
      type: "text",
      required: false,
      autocomplete: "off",
      validation: { maxLength: 40 },
      step: 2,
      officialNote: "Official SCDNR application (Mailing address).",
    },
    {
      name: "mailingState",
      label: "State",
      type: "select",
      required: false,
      // Standard 50-state + DC list per the research directive on homeState;
      // the online option list is CAPTCHA-blocked.
      options: US_STATES,
      step: 2,
      officialNote: "Official SCDNR application (Mailing address). Option list TODO: verify (CAPTCHA).",
    },
    {
      name: "mailingZip",
      label: "Zip",
      type: "zip",
      required: false,
      mask: "zip",
      autocomplete: "off",
      validation: { pattern: "^\\d{5}(-\\d{4})?$", patternMessage: "Enter a valid ZIP code" },
      step: 2,
      officialNote: "Official SCDNR application (Mailing address).",
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel",
      required: true,
      mask: "phone",
      autocomplete: "tel",
      // Provenance only: buildFieldSchema() enforces its own masked phone
      // pattern ((555) 123-4567) for type "tel"; the phone mask produces it.
      validation: {
        pattern: "^\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}$",
        patternMessage: "Enter a valid 10-digit phone number",
      },
      step: 2,
      officialNote:
        "Official SCDNR application shows two Phone fields, each with Home / Cell / Work checkboxes. Required flag TODO: verify online (CAPTCHA).",
    },
    {
      name: "phoneType",
      label: "Phone Type",
      type: "radio",
      required: true,
      options: [
        { value: "home", label: "Home" },
        { value: "cell", label: "Cell" },
        { value: "work", label: "Work" },
      ],
      step: 2,
      officialNote: "Checkbox options 'Home / Cell / Work' from official SCDNR application.",
    },
    {
      name: "email",
      label: "E-mail Address",
      type: "email",
      required: true,
      autocomplete: "email",
      helpText: "A copy of your license will be sent to the email address on file.",
      validation: { maxLength: 60 },
      step: 2,
      officialNote:
        "Exact label 'E-mail Address' from official SCDNR application. Portal states license copy is emailed; required flag TODO: verify online (CAPTCHA).",
    },
    {
      name: "driversLicenseNumber",
      label: "SC Driver's License or ID#",
      type: "text",
      required: true,
      helpText:
        "Applicants must present a state issued identification document. Resident licenses require an unexpired South Carolina Driver's License or SCDMV issued ID Card; residency is determined by its date of issue. International customers may provide a passport.",
      autocomplete: "off",
      validation: { maxLength: 25 },
      step: 2,
      officialNote:
        "Exact label from official SCDNR application. Portal login dropdown option: 'U.S Driver's License / State ID'. dnr.sc.gov/licenses/genlicense.html requires state-issued ID for all applicants.",
    },
    {
      name: "idStateOfIssue",
      label: "State of Issue",
      type: "select",
      required: true,
      // Standard 50-state + DC list per the research directive on homeState;
      // the online option list is CAPTCHA-blocked.
      options: US_STATES,
      step: 2,
      officialNote:
        "Exact label from official SCDNR application (paired with driver's license/ID#). Option list TODO: verify (CAPTCHA).",
    },
    {
      name: "hunterEducationNumber",
      label: "Hunter Education Number",
      type: "text",
      required: false,
      helpText:
        "Hunter Education Certification is required for persons born after June 30, 1979 who apply for hunting privileges (Combination, Sportsman, Junior Sportsman licenses). Not required for fishing-only licenses.",
      autocomplete: "off",
      validation: { maxLength: 20 },
      // TYPE-MAP: research conditional { field: "licenseCategory", equals: "combo" }
      // dropped — `licenseCategory` is not an applicant-data field, so the rule
      // could never fire (field permanently hidden + never validated). Kept
      // always-visible + optional; helpText carries the hunting-only rule.
      step: 2,
      officialNote:
        "Exact label from official SCDNR application 'Hunter Education Certification' section.",
    },
    {
      name: "hunterEducationStateOfIssue",
      label: "State of Issue",
      type: "select",
      required: false,
      // TYPE-MAP: research conditional { field: "licenseCategory", equals: "combo" }
      // dropped (same reason as hunterEducationNumber). Standard 50-state + DC
      // list per the research directive on homeState.
      options: US_STATES,
      step: 2,
      officialNote:
        "Exact label from official SCDNR application (Hunter Education Certification section). Option list TODO: verify (CAPTCHA).",
    },
  ],
  stateIdentifiers: [
    {
      name: "SCDNR Customer ID",
      label: "Customer #",
      helpText:
        "Auto-generated when your personal information is first entered (number begins with 'C'). Located in the lower left hand corner of SCDNR-issued licenses. Used for all future purchases, lottery hunts, and SCDNR business. Call SCDNR Licensing at (803) 734-3833 if you cannot locate it.",
      required: false,
    },
  ],
  consentExtra:
    "I affirm that I am not under suspension for any natural resources violation and I am eligible to apply for, hold, and use the above SCDNR licenses and permits and that the information provided above is true and correct. (Official SCDNR application affirmation.) Personal information collected by SCDNR may be subject to disclosure under the SC Freedom of Information Act; state law prohibits its use for private solicitation or commercial purposes (SC Family Privacy Protection Act, Section 30-2-50).",
  researchNotes:
    "Fees verified on TWO official sources: dnr.sc.gov resident/nonresident pricing pages and the official eRegulations fee table (fees effective July 1, 2025 - June 30, 2026). Portal (Go Outdoors SC / license.gooutdoorssouthcarolina.com) starts with a customer lookup (Date of Birth (MM/DD/YYYY), Customer Last Name, and one of: Last Four of SSN / U.S Driver's License / State ID / Customer ID / Other), then new customers enroll. Full enrollment form sits behind Cloudflare CAPTCHA and could not be screenshotted; the complete applicant field set was taken from the official SCDNR paper applications (Recreational Hunting and Fishing Tag Application 25-14585 Rev. 05/2025; Lifetime; Disability), which collect the same data. SC has NO trout stamp/permit - trout fishing is covered by the freshwater fishing license (absent from both official fee schedules). Residency: domiciled resident, proven by unexpired SC DL/ID; 30 days for recreational licenses, 180 days for 3-year/lifetime, 365 days for disability/commercial. Military stationed in SC 30+ days and full-time students get resident privileges. Saltwater tiers differ by residency: residents get 14-day/annual/3-year; nonresidents get 1-day/7-day/annual (no NR 14-day, no NR 3-year). Annual licenses expire 1 year from purchase (anniversary); nongame tags/commercial/shrimp expire June 30. Children under 16 need no license. Online sales final; order number allows immediate fishing. Senior (64+) $9 lifetime, Gratis (born on/before 7/1/1940) free, and no-cost disability licenses are mail/in-person applications only. Portal also sells 'License Activity Packages' (e.g., resident Avid Angler $51 = annual FW + annual SW + hard card + SC Wildlife magazine subscription; non-resident Avid Angler $136) - marketing bundles, not license types.",
};

export default config;
