import type { Person } from "./person.model";

export interface Slot {
    house: string;
    category: string;
    guest: Person | null;
}