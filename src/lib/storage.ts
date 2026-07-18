/**
 * Storage adapter for submitted applications.
 *
 * TODO: replace with a real database adapter (Postgres, etc.).
 * Any production adapter MUST encrypt PII — especially SSNs — at rest,
 * restrict access, and set a retention policy. Never store plaintext SSNs.
 */

export interface StoredApplication {
  reference: string;
  stateSlug: string;
  residency: string;
  licenseId: string;
  addOnIds: string[];
  /** Applicant data. The console adapter receives a MASKED copy only. */
  data: Record<string, unknown>;
  consents: {
    accurate: boolean;
    purchaseAuthorized: boolean;
    termsAccepted: boolean;
  };
  submittedAt: string; // ISO timestamp
}

export interface StorageAdapter {
  saveApplication(app: StoredApplication): Promise<void>;
}

/**
 * Development adapter: logs a summary to the server console.
 * The caller is responsible for passing a MASKED data payload —
 * this adapter never persists anything.
 */
export const consoleStorage: StorageAdapter = {
  async saveApplication(app: StoredApplication): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `[storage:console] saved application ${app.reference} (${app.stateSlug}) — dev only, not persisted`,
    );
  },
};

/** Swap this export to change the active storage adapter. */
export const storage: StorageAdapter = consoleStorage;
