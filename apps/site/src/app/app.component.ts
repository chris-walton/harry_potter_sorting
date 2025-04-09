import { Component, computed, inject, signal, } from '@angular/core';
import type { OnInit, WritableSignal } from '@angular/core';
import { GUESTS, CATEGORIES, LOLA } from './data';
import type { Assignment, Person, Slot } from './models';
import { AiDataService, SorterService, } from './services';
import type { House } from './view-model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly sorter = inject(SorterService);
  private readonly aiDataService = inject(AiDataService);
  private assignmentNumber = 1;

  private readonly partyGuests: Person[] = [
    { name: LOLA.name, category: LOLA.category, order: CATEGORIES.find(c => c.id === LOLA.category)?.score ?? 0 },
    ...GUESTS.map(g => ({ name: g.name, category: g.category, order: CATEGORIES.find(c => c.id === g.category)?.score ?? 0 })),
  ].sort((a, b) => a.name.localeCompare(b.name));
  private readonly slots: WritableSignal<Slot[]> = signal([]);

  readonly houses: WritableSignal<House[]> = signal(this.sorter.getHousesInRandomOrder());

  readonly ready = signal(false);
  readonly started = signal(false);
  readonly assignments = signal<Assignment[]>([]);
  readonly current = computed(() => this.started() ? this.assignments()[0] : null);
  readonly done = signal(false);
  readonly audioUrl = signal('');

  ngOnInit(): void {
    const houses = this.houses();
    this.sorter.createSlots(houses, this.partyGuests);

    //this.slots.set(...houses.map(x => x.slots()));
    this.houses.set(houses);

    const slots: Slot[] = [];
    for (const house of houses) {
      slots.push(...house.slots());
    }
    this.slots.set(slots);

    this.assign();

    // Add keyboard event listener
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        this.continue();
      } else if (event.key === ' ') {
        this.playAssignment();
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key.toLowerCase() === 's') {
        this.start();
      }
    });
  }

  moveToNext(name: string): void {
    this.assignments.update(x => {
      //
      //  If the top has been assigned, remove it.
      //
      if (x[0].assigned) {
        x.splice(0, 1);
      }

      const index = x.findIndex(y => y.guest === name);

      if (index === -1) return x;

      const assignment = x[index];

      x.splice(index, 1);

      return [assignment, ...x];
    });
  }

  getLength(house: string, category: string): number {
    return this.slots().filter(x => x.house === house && x.category === category).length;
  }

  start(): void {
    this.started.set(true);
  }

  async assign(): Promise<void> {
    let assignments = this.sorter.getAssignmentList(this.partyGuests, this.houses());

    while (assignments == null) {
      console.log('REDO');
      assignments = this.sorter.getAssignmentList(this.partyGuests, this.houses());
    }

    this.sorter.createPrompts(assignments);

    this.assignments.set(assignments);

    //this.aiDataService.verifyAsync(assignments.map(x => x.prompt ?? '')).subscribe();

    this.ready.set(true);
  }

  playAssignment(): void {
    const houses = this.houses();
    const assignment = this.current();

    if (!assignment || assignment.assigned || !assignment.prompt) return;

    const house = houses.find(x => x.name === assignment.house);
    const person = this.partyGuests.find(x => x.name === assignment.guest);

    if (!house || !person) return;

    const slot = house.slots().find(x => x.category === assignment.category && x.guest == null);

    if (slot == null) {
      console.log('NO SLOT', house.name, person.category, person.name);
      console.log(house.slots());
      return;
    }
    this.playAudio(assignment.prompt, () => {
      slot.guest = person.name;
      slot.assignmentNumber = this.assignmentNumber++;
      this.assignments.update(x => {
        x[0].assigned = true;

        return [...x];
      });

      house.slots.set(this.sorter.arrangeSlots(house.slots()));
    });
  }

  continue(): void {
    const current = this.current();

    if (!current || !current.assigned) return;

    this.assignments.update(x => {
      x.splice(0, 1);

      return [...x];
    });
  }

  private playAudio(text: string, done?: () => void): void {
    const text2 = encodeURIComponent(text);
    const audio = new Audio(`http://localhost:8787/api/text/${text2}`);

    audio.oncanplaythrough = () => {
      audio.play()
        .catch(err => {
          console.error('Error playing audio:', err.message);
        });
    };

    audio.onended = () => {
      done?.();
    };

    audio.onerror = (err) => {
      console.error('Error loading audio:', err.toString());
    };
  }
}
