import { Pipe } from "@angular/core";
import type { Slot } from "../models";

@Pipe({
    name: 'listSort',
    standalone: true,
})
export class ListSortPipe {
    transform(value: Slot[]): Slot[] {
        return value.sort((a, b) => {
            if (a.guest == null && b.guest == null) return 0;
            if (a.guest == null) return 1;
            if (b.guest == null) return -1;

            const a2 = a.guest.category === 'leader' ? 0 : a.guest.category === 'middle' ? 1 : 2;
            const b2 = b.guest.category === 'leader' ? 0 : b.guest.category === 'middle' ? 1 : 2;

            return a2 - b2;
        });
    }
}