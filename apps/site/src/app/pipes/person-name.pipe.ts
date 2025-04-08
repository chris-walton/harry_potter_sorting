import { Pipe } from "@angular/core";
import type { Person } from "../models";

@Pipe({
    name: 'personName',
    standalone: true,
})
export class PersonNamePipe {
    transform(value: Person | null): string {
        if (!value) {
            return '';
        }

        return `${value.name} (${value.category})`;
    }
}