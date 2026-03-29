import { useSyncExternalStore } from "react";
import { documentStore } from "@/store/documentStore";

export function useDocumentRecords() {
  const records = useSyncExternalStore(
    documentStore.subscribe,
    documentStore.getAll,
    documentStore.getAll
  );
  return records;
}
