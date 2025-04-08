import { Pipe } from "@angular/core";
import type { Slot } from "../models";

@Pipe({
    name: 'listSort',
    standalone: true,
})
export class ListSortPipe {
    transform(value: Slot[]): Slot[] {
        const assigned = value.filter(x => x.assignmentNumber != null).sort((a, b) => (a.assignmentNumber ?? 0) - (b.assignmentNumber ?? 0));
        const unassigned = value.filter(x => x.assignmentNumber == null);

        return [...assigned, ...unassigned];
    }
}