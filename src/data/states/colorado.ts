import type { StateConfig } from "@/lib/state-config";

/**
 * COLORADO — Colorado Parks and Wildlife (CPW)
 * Portal: CPWshop — Colorado Parks and Wildlife IPAWS (https://www.cpwshop.com)
 * Source: /research/colorado.json (fees = official 2026-27 license year,
 * verified 2026-07-18 against the 2026 Colorado Fishing Brochure and
 * cpw.state.co.us). Every value below traces to that research file.
 */
export const config: StateConfig = {
  slug: "colorado",
  stateName: "Colorado",
  officialAgencyName: "Colorado Parks and Wildlife",
  officialPortalName: "CPWshop — Colorado Parks and Wildlife IPAWS",
  officialPortalUrl: "https://www.cpwshop.com",
  lastVerified: "2026-07-18",
  serviceFee: 29,
  requiresSSN: true,
  ssnExplainer:
    "Colorado requires a Social Security number or Individual Taxpayer Identification Number (ITIN) to buy a license — for new customers age 16 and older (age 12+ for a second-rod stamp), per federal law. It is not displayed on the license; it is provided, if requested, to Child Support Enforcement authorities.",
  residencyOptions: [
    { value: "resident", label: "Resident" },
    { value: "nonresident", label: "Nonresident" },
  ],
  licenseYearNote:
    "Annual licenses valid March 1 – March 31 of the following year (13 months). Annual licenses go on sale March 1 each year. Youth aged 15 and under fish free.",
  licenses: [
    {
      id: "resident-annual-fishing",
      name: "Adult Annual Fishing License",
      price: 44.87,
      residency: "resident",
      duration: "Annual",
      category: "freshwater",
      description:
        "Colorado residents ages 18–63. Valid March 1–March 31 of the following year (13 months).",
      suggestedAddOns: ["habitat-stamp", "second-rod-stamp"],
      officialNote:
        "2026-27 fee per official 2026 Colorado Fishing Brochure (cpw.widen.net/s/nhcmmzftsv/colorado-fishing-brochure) and cpw.state.co.us fishing-licenses page. Fee includes $1.25 backcountry search-and-rescue fee and $1.50 Wildlife Education Fund fee.",
    },
    {
      id: "nonresident-annual-fishing",
      name: "Nonresident Annual Fishing License",
      price: 124.01,
      residency: "nonresident",
      duration: "Annual",
      category: "freshwater",
      description:
        "Nonresidents ages 16+ (listed as 'Nonresidents — Annual (16+)' in the official fee table). Valid March 1–March 31 of the following year (13 months).",
      suggestedAddOns: ["habitat-stamp", "second-rod-stamp"],
      officialNote:
        "2026-27 fee per official 2026 Colorado Fishing Brochure fee table. CPW's fishing-licenses web page lists resident fees only; nonresident fees appear in the brochure.",
    },
    {
      id: "senior-annual-fishing",
      name: "Senior Annual Fishing License",
      price: 12.96,
      residency: "senior",
      duration: "Annual",
      category: "freshwater",
      description:
        "Colorado residents ages 64+. Income-eligible residents 64+ can apply for the Centennial senior low-income license (application-based, not sold in the online catalog).",
      suggestedAddOns: ["habitat-stamp", "second-rod-stamp"],
    },
    {
      id: "youth-annual-fishing",
      name: "Youth Fishing License",
      price: 12.96,
      residency: "youth",
      duration: "Annual",
      category: "freshwater",
      description:
        "Colorado residents ages 16–17 (second-rod stamp charge still applies). Youth under 16 fish free with full bag/possession limits but need a second-rod stamp to fish a second line. Nonresidents 16+ have NO discounted youth license — they buy the nonresident annual, five-day or one-day license.",
      suggestedAddOns: ["second-rod-stamp"],
    },
    {
      id: "one-day-fishing-resident",
      name: "One-day Fishing (Resident)",
      price: 18.07,
      residency: "resident",
      duration: "1-Day",
      category: "freshwater",
      description:
        "Single-day license. Buyers of one-day/one-additional-day licenses are exempt from the Habitat Stamp fee on the first two of these licenses; the fee is assessed when a third is purchased.",
      suggestedAddOns: ["second-rod-stamp"],
    },
    {
      id: "one-day-fishing-nonresident",
      name: "One-day Fishing (Nonresident)",
      price: 21.9,
      residency: "nonresident",
      duration: "1-Day",
      category: "freshwater",
      description:
        "Single-day license for nonresidents ages 16+. Same Habitat Stamp exemption rule as resident one-day (first two exempt; third purchase triggers the stamp).",
      suggestedAddOns: ["second-rod-stamp"],
    },
    {
      id: "additional-day-fishing",
      name: "Additional-day Fishing",
      price: 9.13,
      residency: "any",
      duration: "Additional Day",
      category: "freshwater",
      description:
        "Extra day added to a one-day license; same price for residents and nonresidents. Same Habitat Stamp exemption rule as one-day licenses.",
      suggestedAddOns: ["second-rod-stamp"],
    },
    {
      id: "five-day-fishing-nonresident",
      name: "Five-day Fishing (Nonresident)",
      price: 41.04,
      residency: "nonresident",
      duration: "5-Day",
      category: "freshwater",
      description:
        "Nonresidents ages 16+ (listed as 'Nonresidents — Five-day (16+)' in the official fee table). Colorado does NOT offer a resident five-day fishing license.",
      suggestedAddOns: ["habitat-stamp", "second-rod-stamp"],
    },
    {
      id: "small-game-fishing-combo",
      name: "Small Game and Fishing Combo",
      price: 64.02,
      residency: "resident",
      duration: "Annual",
      category: "combo",
      description:
        "Annual resident combination small game hunting + fishing license (sold in the fishing catalog as 'Small Game and Fishing Combo').",
      suggestedAddOns: ["habitat-stamp", "second-rod-stamp"],
    },
    {
      id: "senior-small-game-fishing-combo",
      name: "Senior Small Game and Fishing Combo",
      price: 38.03,
      residency: "senior",
      duration: "Annual",
      category: "combo",
      description: "Colorado residents ages 64+. Annual combination small game hunting + fishing license.",
      suggestedAddOns: ["habitat-stamp", "second-rod-stamp"],
    },
    {
      id: "senior-small-game-upgrade",
      name: "Senior Annual Small Game Upgrade for Lifetime Fishing and Resident Low Income Senior Fishing Annual License Holders",
      price: 27.82,
      residency: "senior",
      duration: "Annual",
      category: "combo",
      description:
        "Reduced-cost annual small game upgrade; valid only for resident senior lifetime disability (Columbine) and low-income (Centennial) fishing license holders.",
      officialNote:
        "Name per CPW fishing-licenses page. Niche product — consider omitting from the main catalog.",
    },
  ],
  addOns: [
    {
      // REQUIRED — cpwshop.com auto-adds the Habitat Stamp to the first license
      // purchase of the year when applicable; required: true makes the UI
      // auto-select and lock it (LicenseSelector checked + disabled).
      id: "habitat-stamp",
      name: "Annual Habitat Stamp",
      price: 12.76,
      required: true,
      description:
        "Required for anyone ages 18–64 before buying or applying for any hunting or fishing license. Only ONE is required per person per year; valid March 1–March 31 (13 months). Automatically added to the first license purchase of the year ('One will be automatically added to your purchase, if applicable') and printed on the license indicated by an 'H'. Nonrefundable. Exempt: customers approved in the Columbine, First Responder, Veteran and/or Big Game Mobility Impaired disability programs. One-day/additional-day buyers are exempt on the first two such licenses; the fee is assessed when a third is purchased.",
      officialNote:
        "Auto-added by cpwshop.com when applicable. 2026-27 price $12.76 confirmed by the official 2026 Fishing Brochure and the CPW fishing-licenses page; CPW's habitat-stamp page still shows $12.47 (stale 2025-26 fee) — TODO: verify — https://cpw.state.co.us/habitat-stamp",
    },
    {
      id: "second-rod-stamp",
      name: "Second-rod Stamp",
      price: 14.24,
      required: false,
      description:
        "Allows fishing with a second rod, handline or tip-up. One stamp per season, nontransferable; does NOT entitle the angler to an additional bag limit and cannot be used for another person to fish. Not required when only using trotlines or jugs. Available to anyone who has purchased a fishing license and to any youth under 16 (youth under 16 and seniors must carry one to fish a second line).",
    },
    {
      id: "lifetime-habitat-stamp",
      name: "Lifetime Habitat Stamp",
      price: 384.16,
      required: false,
      description: "One-time lifetime alternative to the Annual Habitat Stamp.",
    },
  ],
  formFields: [
    {
      name: "salutation",
      label: "Salutation",
      type: "select",
      required: false,
      options: [
        { value: "", label: "No Salutation" },
        { value: "Mr", label: "Mr" },
        { value: "Ms", label: "Ms" },
        { value: "Mrs", label: "Mrs" },
        { value: "Miss", label: "Miss" },
        { value: "Sir", label: "Sir" },
        { value: "Dr", label: "Dr" },
        { value: "Rev", label: "Rev" },
      ],
      step: 2,
      officialNote:
        "Observed live on https://www.cpwshop.com/signup.page (Create Account Step 1/6: Personal Information). No asterisk = optional.",
    },
    {
      name: "firstName",
      label: "First Legal Name",
      type: "text",
      required: true,
      autocomplete: "given-name",
      step: 2,
      officialNote: "Observed live on cpwshop.com signup Step 1/6 (required asterisk shown).",
    },
    {
      name: "middleInitial",
      label: "Middle Initial",
      type: "text",
      required: false,
      step: 2,
      officialNote: "Observed live on cpwshop.com signup Step 1/6 (no asterisk = optional).",
    },
    {
      name: "lastName",
      label: "Last Legal Name",
      type: "text",
      required: true,
      autocomplete: "family-name",
      step: 2,
      officialNote: "Observed live on cpwshop.com signup Step 1/6 (required asterisk shown).",
    },
    {
      name: "suffix",
      label: "Suffix",
      type: "select",
      required: false,
      options: [
        { value: "", label: "No Suffix" },
        { value: "JR", label: "JR" },
        { value: "SR", label: "SR" },
        { value: "I", label: "I" },
        { value: "II", label: "II" },
        { value: "III", label: "III" },
        { value: "IV", label: "IV" },
        { value: "V", label: "V" },
        { value: "VI", label: "VI" },
        { value: "VII", label: "VII" },
      ],
      step: 2,
      officialNote: "Observed live on cpwshop.com signup Step 1/6 (no asterisk = optional).",
    },
    {
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
      mask: "dob",
      step: 2,
      officialNote:
        "Observed live on cpwshop.com signup Step 1/6. Official control is a composite: 'Month' select (January–December) + Day input + Year input. Drives the 'Age' question that filters the license catalog ('Enter your age and residency to view available licenses' — cpwshop.com/purchaseprivilege.page).",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      autocomplete: "email",
      helpText:
        "Each customer — including youth — needs an individual CPW account with a separate, valid email address.",
      step: 2,
      officialNote:
        "Observed live on cpwshop.com signup Step 1/6 (required asterisk shown). Unique-email requirement per CPW guidance (cpw.state.co.us/cpwshop FAQ).",
    },
    {
      name: "addressLine1",
      label: "Mailing Address",
      type: "text",
      required: true,
      autocomplete: "address-line1",
      step: 2,
      officialNote:
        "TODO: verify — https://www.cpwshop.com/signup.page (Create Account Step 2/6: Contact Details collects the mailing address; exact field labels/structure could not be directly observed — wizard steps 2–6 are behind validated Step 1). CPW confirms accounts carry 'phone, email and mailing address'. Resident licenses require the physical residence address to match Colorado state income tax records.",
    },
    {
      name: "city",
      label: "City",
      type: "text",
      required: true,
      autocomplete: "address-level2",
      step: 2,
      officialNote: "TODO: verify — see addressLine1 note (signup Step 2/6).",
    },
    {
      name: "state",
      label: "State",
      type: "select",
      required: true,
      autocomplete: "address-level1",
      step: 2,
      officialNote:
        "TODO: verify — see addressLine1 note (signup Step 2/6). Options presumably the 50 US states + territories; exact list not observed.",
    },
    {
      name: "zipCode",
      label: "ZIP Code",
      type: "zip",
      required: true,
      mask: "zip",
      autocomplete: "postal-code",
      validation: { pattern: "^\\d{5}(-\\d{4})?$", patternMessage: "Enter a valid ZIP code (e.g., 80216)." },
      step: 2,
      officialNote: "TODO: verify — see addressLine1 note (signup Step 2/6).",
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel",
      required: true,
      mask: "phone",
      autocomplete: "tel",
      step: 2,
      officialNote:
        "TODO: verify — collected in Create Account Step 4/6: Contact Methods and Preferences on cpwshop.com; exact label not observed. CPW confirms accounts carry a phone number.",
    },
    {
      name: "identificationType",
      label: "Identification Type",
      type: "select",
      required: true,
      options: [
        { value: "drivers-license", label: "Driver License or Driver Permit" },
        { value: "state-id", label: "State Identification Card" },
        { value: "us-passport", label: "U.S. Passport" },
        { value: "foreign-passport", label: "Foreign Passport with I-94" },
        { value: "military-id", label: "U.S. Military ID" },
        { value: "tribal-id", label: "Tribal Identification Card" },
        { value: "permanent-resident-card", label: "Permanent Resident Card (I-551)" },
        { value: "naturalization-certificate", label: "Certificate of Naturalization" },
        { value: "ead", label: "Employment Authorization Card (EAD)" },
      ],
      step: 2,
      officialNote:
        "TODO: verify — https://www.cpwshop.com/signup.page (Create Account Step 3/6: Identification). Option LABELS above are condensed from CPW's official 'Acceptable Identification to Purchase a License' list (cpw.state.co.us/acceptable-identification-purchase-license); the exact dropdown options in Step 3/6 were not directly observed.",
    },
    {
      name: "identificationNumber",
      label: "Identification Number",
      type: "text",
      required: true,
      step: 2,
      officialNote:
        "TODO: verify — signup Step 3/6: Identification. Government-issued ID is required to purchase a license (cpw.state.co.us fishing-licenses page). Exact label not observed.",
    },
    {
      name: "identificationState",
      label: "ID Issuing State",
      type: "select",
      required: false,
      conditional: { field: "identificationType", oneOf: ["drivers-license", "state-id"] },
      step: 2,
      officialNote:
        "TODO: verify — whether the portal asks for the issuing state of the driver's license/ID. Out-of-state photo driver licenses/ID cards are accepted.",
    },
    {
      name: "ssn",
      label: "Social Security Number",
      type: "ssn",
      required: true,
      mask: "ssn",
      helpText:
        "Required by state and federal law for new customers age 16+ (age 12+ for a second-rod stamp). Not displayed on your license; provided only to Child Support Enforcement authorities on request. An ITIN may be provided instead.",
      // Kept verbatim from research. NOTE: shared buildFieldSchema() handles
      // type "ssn" with its own dashed SSN_PATTERN and ignores this pattern;
      // with mask "ssn" the dashed format is what actually gets validated.
      validation: { pattern: "^\\d{9}$", patternMessage: "Enter the 9-digit Social Security number (no dashes)." },
      step: 2,
      officialNote:
        "Verified: 2026 Colorado Fishing Brochure — 'A Social Security number or Individual Taxpayer Identification number is required for new customers age 16 and older (age 12 for a second-rod stamp), per federal law.' CPW fishing-licenses page — 'A Social Security Number or Individual Taxpayer Identification Number is required for hunters age 12 and older, per federal law.' Whether the online form accepts ITIN inline = TODO: verify (signup Step 6/6).",
    },
    {
      name: "residencyDeclaration",
      label: "Residency",
      type: "radio",
      required: true,
      options: [
        { value: "resident", label: "Resident" },
        { value: "nonresident", label: "Nonresident" },
      ],
      step: 2,
      officialNote:
        "cpwshop.com purchase flow asks 'Enter your age and residency to view available licenses' (purchaseprivilege.page) and includes a residency confirmation page before checkout. Exact option labels TODO: verify. Resident products require proof of residency (CO driver's license/ID issued 6+ months prior, or 2 additional proofs).",
    },
  ],
  stateIdentifiers: [
    {
      name: "cpwCid",
      label: "CID (Customer Identification Number)",
      helpText:
        "Your 9-digit CPW Customer Identification number, printed on any previous CPW license. New customers are assigned a CID when they create an account on cpwshop.com; it is used as the sign-in identifier along with your password. Leave blank if you have never held a CPW license/account.",
      required: false,
    },
  ],
  consentExtra:
    "Child Support Delinquency: State and federal law require a Social Security number or Individual Taxpayer Identification number to buy a license. It is not displayed on the license but is provided, if requested, to Child Support Enforcement authorities. Hunting and fishing licenses are not issued to those suspended for noncompliance with child support, and any current licenses become invalid if the holder is deemed noncompliant by Child Support Enforcement.",
  // researchNotes below is verbatim from colorado.json; the JSON's top-level
  // "sources" array is appended at the end because StateConfig has no
  // dedicated sources field.
  researchNotes:
    "PRICE YEAR: The task asked for '2025-2026' prices, but as of lastVerified (2026-07-18) the current license year on sale is 2026-27 (valid March 1, 2026 – March 31, 2027), so JSON prices = official 2026-27 fees from the 2026 Colorado Fishing Brochure (official CPW-hosted PDF) cross-verified against the live cpw.state.co.us fishing-licenses page. Fees are adjusted annually with CPI. For reference, 2025-26 brochure fees were: Habitat Stamp $12.47, Lifetime Habitat Stamp $374.47, Adult annual $42.91, Senior/Youth $11.73, Small game & fishing combo $61.62, Senior combo $36.22, Senior small game upgrade $24.49, Second-rod stamp $12.98, One-day $16.72, Additional-day $7.99 (nonresident 2025-26 not re-verified). CATALOG FILTERING: cpwshop.com filters the license catalog by 'Age' and 'Residency' (purchaseprivilege.page) — the residencyOptions list mirrors this. NONRESIDENT FEES: not shown on the CPW fishing-licenses web page (resident fees only); nonresident fees verified in the official 2026 Fishing Brochure fee table. WIZARD: cpwshop.com Create Account = 6 steps (1 Personal Information [all fields observed live]; 2 Contact Details; 3 Identification; 4 Contact Methods and Preferences; 5 Create Password; 6 Add required information for Hunting and Fishing). Steps 2–6 are gated behind validated Step 1 and could not be screenshotted without creating a real account — labels marked TODO. PHYSICAL DESCRIPTORS: NO official source indicates Colorado collects height/weight/eye/hair for fishing licenses; none appear in Step 1 and CPW's 'what you need' list mentions only ID, residency proof, SSN/ITIN and Habitat Stamp — treated as NOT asked (TODO: confirm against signup Step 6/6). FREE FISHING DAYS: first full weekend of June each year — no license or Habitat Stamp needed. ANS STAMP ($25 resident / $50 nonresident, annual) applies to motorboats/sailboats only, NOT to fishing licenses — excluded from addOns. COMMERCIAL LICENSE $40 (bait fish/amphibians/crustaceans for commercial purposes) is application-based (cpw.state.co.us/purchase-special-license) — excluded from licenses[]. Disability/veteran lifetime programs (Columbine, First Responder, Disabled Veteran, Centennial low-income senior) are application-based and not sold in the online catalog — excluded. DISCREPANCIES: (1) CPW habitat-stamp page shows stale $12.47/$374.47 and stale 'April 1–March 31' season text, while the same page's fee table and the 2026 brochure say $12.76/$384.16 and March 1–March 31 (13 months). (2) CPW fishing-licenses page says SSN required 'for hunters age 12 and older' while the brochure says 'new customers age 16 and older (age 12 for a second-rod stamp)'. (3) Brochure says senior fees include a '$1.25 backcountry search-and-rescue fee' (increased from $0.25 in 2026). SOURCES: https://cpw.state.co.us/activities/fishing/fishing-licenses-and-dates ; https://cpw.widen.net/s/nhcmmzftsv/colorado-fishing-brochure ; https://cpw.state.co.us/habitat-stamp ; https://cpw.state.co.us/acceptable-identification-purchase-license ; https://cpw.state.co.us/colorado-residents ; https://www.cpwshop.com/signup.page ; https://www.cpwshop.com/purchaseprivilege.page ; https://www.cpwshop.com/customeraccount.page ; https://www.cpwshop.com/identifyprofile.page ; https://mycolorado.gov/app-services/cpw-digital-licenses ; https://www.eregulations.com/colorado/fishing/license-stamp-fees",
};

export default config;
