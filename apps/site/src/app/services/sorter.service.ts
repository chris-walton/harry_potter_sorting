import { inject, Injectable } from "@angular/core";
import { BREAKS, CATEGORIES, DONT_COMBINE, HOUSES, LOLA } from "../data";
import { House } from "../view-model";
import type { Assignment, Person, Slot } from "../models";
import { AiDataService } from "./ai.data-service";

@Injectable({ providedIn: 'root' })
export class SorterService {
    private readonly aiDataService = inject(AiDataService);

    getHousesInRandomOrder(): House[] {
        const houses = structuredClone(HOUSES);

        for (let i = houses.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [houses[i], houses[j]] = [houses[j], houses[i]];
        }
        return houses.map(x => new House(x.name, x.image, x.font, x.primary, x.secondary));
    }

    getAssignmentList(people: Person[], houses: House[]): Assignment[] | undefined {
        const testHouses: House[] = [];
        const testPeople = this.getGuestList(people);

        for (const house of houses) {
            const testHouse = new House(house.name, house.image, house.font, house.primary, house.secondary);
            testHouse.slots.set(structuredClone(house.slots()));
            testHouses.push(testHouse);
        }
        const results: Assignment[] = [];

        while (testPeople.length > 0) {
            const person = testPeople[0];
            let housesWithEmptySlots = testHouses.filter(x => x.slots().filter(y => y.category === person.category && y.guest == null).length > 0);
            let houseIndex = this.getRandomIndex(housesWithEmptySlots.length);
            const house = housesWithEmptySlots[houseIndex];
            const slots = house.slots();
            const slot = slots.find(x => x.category === person.category && x.guest == null);

            if (slot == null) {
                console.error('SLOT NULL', person.name);
                //
                // Try again
                //
                return undefined;
            }
            if (!this.canContinue(slots, person.name)) {
                //
                // Find a different house for this person
                //
                housesWithEmptySlots = housesWithEmptySlots.filter(x => x.name !== house.name);

                if (housesWithEmptySlots.length === 0) {
                    console.error('NO HOUSES WITH EMPTY SLOTS', person.name);
                    //
                    // Try again
                    //
                    return undefined;
                }

                houseIndex = this.getRandomIndex(housesWithEmptySlots.length);
            }

            slot.guest = person.name;

            house.slots.set(slots);

            testPeople.splice(0, 1);
            results.push({ house: house.name, guest: person.name, category: person.category });
        }
        return results;
    }


    createSlots(houses: House[], guests: Person[]): void {
        const slots: Slot[] = [];

        for (const category of CATEGORIES) {
            const catSlots = this.createSlotsPerCategory(houses, guests.filter(x => x.category === category.id));

            for (const catSlot of catSlots) {
                slots.push(catSlot);

                //houses.find(x => x.name === catSlot.house)?.slots.update(x => [...x, catSlot]);
            }
        }
        const lastCat = CATEGORIES[CATEGORIES.length - 1];
        const houseWithZeroLastCats = houses.filter(x => x.slots().filter(y => y.category === lastCat.id).length === 0)[0];
        const houseWithMultipleLastCats = houses.filter(x => x.slots().filter(y => y.category === lastCat.id).length > 1)[0];

        if (houseWithMultipleLastCats && houseWithZeroLastCats) {
            //
            //  Move one guest from houseWithMultipleLastCats to houseWithZeroLastCats
            //
            houseWithZeroLastCats.slots.update(x => [...x, { id: crypto.randomUUID(), house: houseWithZeroLastCats.name, category: lastCat.id, guest: null }]);
            houseWithMultipleLastCats.slots.update(x => {
                const slots: Slot[] = [];

                for (let index = 0; index < x.length - 1; index++) {
                    slots.push(x[index]);
                }

                return slots;
            });
        }
    }

    createPrompts(assignments: Assignment[]): void {
        let previousIndex = -1;

        for (const assignment of assignments) {
            let index = this.getRandomIndex(BREAKS.length);

            while (index === previousIndex) index = this.getRandomIndex(BREAKS.length);

            const name = this.nameChanges(assignment.guest);
            const prompt = BREAKS[this.getRandomIndex(BREAKS.length)];

            assignment.prompt = `"${name}" <break time="1.5s" /> "${prompt}" <break time="1.0s" /> "${assignment.house}!"`;

            previousIndex = index;
        }
    }


    private getGuestList(guests: Person[]): Person[] {
        const lola = guests.find(x => x.name === LOLA.name);

        if (!lola) return [];

        const result: Person[] = [lola];
        const nonLolaGuests = guests.filter(x => x.name !== LOLA.name);

        while (nonLolaGuests.length > 0) {
            const randomPersonIndex = this.getRandomIndex(nonLolaGuests.length);
            const person = nonLolaGuests[randomPersonIndex];

            result.push(person);

            nonLolaGuests.splice(randomPersonIndex, 1);
        }
        console.log(structuredClone(result));
        return result;
    }

    private canContinue(slots: Slot[], person: string): boolean {
        if (slots.length === 0) return true;
        const dontCombine = DONT_COMBINE.filter(x => x.includes(person))
            .map(x => x[0] === person ? x[1] : x[0]);

        for (const slot of slots) {
            if (slot.guest == null) continue;
            if (dontCombine.includes(slot.guest)) {
                return false;
            }
        }

        return true;
    }

    getRandomIndex(arraySize: number): number {
        if (arraySize === 0) {
            throw new Error("Array must not be empty");
        }
        return Math.floor(Math.random() * arraySize);
    }

    arrangeSlots(slots: Slot[]): Slot[] {
        const assigned = slots.filter(x => x.assignmentNumber != null).sort((a, b) => (a.assignmentNumber ?? 0) - (b.assignmentNumber ?? 0));
        const unassigned = slots.filter(x => x.assignmentNumber == null);

        return [...assigned, ...unassigned];
    }

    private createSlotsPerCategory(houses: House[], guests: Person[]): Slot[] {
        const slots: Slot[] = [];

        while (guests.length > 0) {
            const guest = guests.pop();
            const house = this.getHouse(houses);

            if (!guest) break;

            const slot: Slot = { id: crypto.randomUUID(), house: house.name, category: guest.category, guest: null };

            slots.push(slot);
            house.slots.update(x => [...x, slot]);
        }
        return slots;
    }

    private getHouse(houses: House[]): House {
        return houses.sort((a, b) => a.score() - b.score())[0];
    }

    private nameChanges(name: string): string {
        if (name === 'Ibra') return 'Eebra';
        if (name === 'Nissa') return 'Neesa';
        if (name === 'Desi') return "Dezi";

        return name;
    }
}