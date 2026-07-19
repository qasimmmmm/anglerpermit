# Form Field Audit — All 7 State Applications

Branch `form-audit`. Method: every `formFields[]` entry in `src/data/states/*.ts`
was diffed programmatically (name/label/type/required/mask/autocomplete/options
order+values/validation/conditional/step) against `/mnt/agents/output/research/<state>.json`,
plus internal-integrity checks (unique names, conditional refs, option-value
uniqueness, mask↔pattern coherence) and cross-state consistency checks.
`tsc --noEmit` ✅ · `npm run build` ✅ (zero errors).

## Fixes applied this audit

1. **texas.ts : driversLicenseState.label : "Driver's License" → "Driver's License State"**
   and **texas.ts : driversLicenseNumber.label : "Driver's License" → "Driver's License Number"**
   Diagnosis of the live-QA report (two "Driver's License" fields on step 2): the
   official View/Edit Customer Details screen shows ONE "Driver's License" label
   over a field *group* = state select (default TX) + number text input
   (research/texas.md "Personal Details" line; texas.json carries the shared label
   on both sub-fields verbatim, which is how the duplicate shipped). The official
   login screen refers to the pair as "Driver's License (# and state)". No true
   duplicate field existed (state vs number capture different data), so both were
   kept and relabeled distinctly. Inline comments cite the research.
2. **florida.ts : suffix.options : order JR,SR,I,II,III,IV,V,VI,VII,VIII,IX,X,DR,ESQ,MD
   → DR,ESQ,I,II,III,IV,IX,JR,MD,SR,V,VI,VII,VIII,X** — the build had re-sorted the
   official dropdown into "conventional" order; research/florida.md §64 and
   florida.json document the portal's alphabetical order. Values/labels unchanged.

No other label, required-flag, type, or validation drift was found in CA, CO, MI,
NC, TX. CA and CO are 1:1 with research (28/28 and 17/17 fields).

## Remaining discrepancies (intentional / documented — kept)

- **MI licenseStartDate** (extra field, not in michigan.json formFields): justified
  by michigan.md ("Daily all species … buyer sets start date/time"). Its
  `conditional: {field:"licenseId", equals:"daily-all-species"}` references the
  wizard's selected license, which ApplicationForm supports explicitly
  (see ApplicationForm.tsx comment re: MI daily-license start date). Works; listed
  here because it is build-added.
- **MI option-value duplicates** (MICHIGAN ×2 in driversLicenseState/resState/
  mailState; UNITED STATES ×2 in resCountry/mailCountry): verbatim from research —
  the official eLicense portal pins the home state/country at the top AND repeats
  it alphabetically. Harmless (same value); kept for fidelity.
- **NC ssnLast4** type ssn→text, mask dropped: documented in the file's
  researchNotes ("BUILD ADAPTATIONS (a)") — the last-4 value can never satisfy the
  shared full-SSN mask/pattern; its own `^\d{4}$` validation applies.
- **SC select→text** (gender, race, scCounty): documented in file header §3 —
  official option lists are CAPTCHA-blocked (research officialNotes carry
  "TODO: verify"), and a required select with zero options would block the wizard.
- **SC 50-state+DC options added** to homeState/mailingState/idStateOfIssue/
  hunterEducationStateOfIssue where research had none: explicitly directed by
  research ("Use standard 50-state + DC list" on homeState). Standard, verifiable.
- **SC scCounty** required true→false + helpText added; **SC hunterEducation\*** and
  **scCounty conditionals dropped** (research: `residency=resident` /
  `licenseCategory=combo`): documented header §4 — ConditionalRule evaluates
  applicant-data fields only; wizard-level `residency`/`licenseCategory` could
  never fire, so the fields would be permanently hidden. (Note: a future
  `{field:"licenseId", oneOf:[combo license ids]}` rule could restore the
  hunter-ed intent — the form already injects licenseId into visibility.)
- **Duplicate labels across address sections** — MI "Street 1/Street 2/City/
  State/Prov/Zip/Postal Code/Country", TX "Address Line 1/2, City/Town, State,
  Zip, Non U.S. Address", SC "City/State/Zip/State of Issue", FL "Phone Type":
  all verbatim from research; the official portals repeat identical labels under
  separate Residence/Mailing (or Primary/Secondary) section headers. Kept for
  fidelity; see recommendation #6 (section grouping) for the UX fix.

## Open TODOs (provenance: research officialNotes — do NOT resolve by inventing data)

- TX: suffix/gender/height/eyeColor/hairColor option lists; DL-state list;
  passportIssuingCountry list; resState/mailState lists; texasResident labels;
  resNonUsAddress conditional behavior — all "TODO: verify — txfgsales.com".
- SC: gender, race, scCounty (46 counties) option lists — "TODO: verify"
  (CAPTCHA-blocked online; SCDNR paper application confirms the fields).
- MI/CA/CO/NC/FL: none outstanding beyond the notes above.

## Stale comments noticed (not edited — provenance)

- texas.ts header NOTE and NC researchNotes item (3) say the shared
  buildFieldSchema/masks hardcode dashed SSN/phone formats and ignore
  field-level patterns. That is now FIXED in shared code (SsnInput
  `useMask={!def.validation?.pattern}`; tel digits-only preprocess), so raw
  9-digit SSN patterns (TX/CO/FL/NC) and TX/NC `^\d{10}$` phone patterns validate
  correctly. SC header §5 is partially stale for the same reason.

## Form-UX recommendations for the shared ApplicationForm (other agent)

1. **Error summary with anchors**: on submit, render a top-of-step "There are N
   problems" box linking each error to its field (`#data-<name>`). Today the form
   only focuses the first `[aria-invalid]` field (ApplicationForm.tsx:531); users
   on 30-field steps must hunt for the rest.
2. **Per-step field counts / sub-sectioning**: step 2 renders 17–32 fields
   (MI/TX 32). Split into official sections (Personal / Residence / Mailing) with
   headings — this also resolves the duplicate-label confusion accessibly
   ("City" under Mailing vs Residence) without changing researched labels.
3. **Field-group rendering**: TX "Driver's License" (state+number), TX height
   (Feet+Inches), FL Primary Phone (type+number) are one visual group on the
   official portals; support a `group` hint so sub-fields render side by side
   under one legend (matches research presentation notes, texas.md line 93).
4. **Mobile input types**: audit every text field for `inputMode`
   (`numeric` for ZIP/phone/SSN already handled via mask/pattern detection —
   extend to `driversLicenseNumber`-style free fields where appropriate) and
   confirm `type="email"`/`type="tel"` everywhere (already good in FieldControl).
5. **Autocomplete audit**: TX mailing-address fields force `autocomplete="off"`;
   consider `shipping address-line1`-style tokens per WHATWG so password managers
   and browser autofill can still help; ensure every email field has
   `autocomplete="email"` and names use `given-name`/`family-name` (most do).
6. **Duplicate-label disambiguation for assistive tech**: where research mandates
   repeated labels (MI/TX/SC address sections, FL Phone Type), add visually-hidden
   context ("Mailing City") or aria-labels so screen-reader users can tell them
   apart even when sighted users see section headers.
7. **Paste handling on masked inputs**: verify paste into SSN/phone/DOB/ZIP masked
   inputs strips non-digits and re-masks (mask functions already strip; add a
   quick unit test + `onPaste` sanity check rather than blocking paste).
8. **Read-only/display field type**: TX `customerId` is system-assigned and the
   research says "DO NOT collect as free input - display only", but it renders as
   an editable text input. Add a `readOnly`/`display` field option (or drop the
   input in favor of help text).
9. **Conditional + wizard values**: generalize the `licenseId` injection so
   conditionals can also reference `residency` (SC scCounty/hunterEducation use
   cases) and validate conditional fields against the same injected values in
   superRefine (today visibility and validation contexts differ for licenseId).
10. **Select-with-no-options fallback**: the text fallback is good; add the
    field's TODO note to rendered helpText so applicants understand why a
    "dropdown" is a text box (e.g. TX State, SC County).
