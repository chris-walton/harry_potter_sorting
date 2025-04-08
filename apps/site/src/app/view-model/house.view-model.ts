import { computed, signal, type WritableSignal } from "@angular/core";
import type { Slot } from "../models";
import { CATEGORIES } from "../data";

export class House {
    constructor(name: string, image: string, font: string, primary: string, secondary: string) {
        this.name = name;
        this.image = image;
        this.font = font;
        this.primary = primary;
        this.secondary = secondary;
        this.slots = signal<Slot[]>([]);
    }

    name: string;
    image: string;
    font: string;
    primary: string;
    secondary: string;
    slots: WritableSignal<Slot[]>;

    score = computed(() => {
        let results = 0;

        for (const slot of this.slots()) {
            results += CATEGORIES.find(x => x.id === slot.category)?.score ?? 0;
        }
        return results;
    });

    capacity = computed(() => this.slots().length);
}
