import { Component, computed, inject, signal, } from '@angular/core';
import type { OnInit, WritableSignal } from '@angular/core';
import { GUESTS, CATEGORIES, LOLA } from './data';
import type { Assignment, Person, Slot } from './models';
import { ListSortPipe } from './pipes/list-sort.pipe';
import { PersonNamePipe } from './pipes/person-name.pipe';
import { AiDataService, SorterService, } from './services';
import type { House } from './view-model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [ListSortPipe, PersonNamePipe],
})
export class AppComponent implements OnInit {
  private readonly sorter = inject(SorterService);
  private readonly aiDataService = inject(AiDataService);

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
  readonly done = computed(() => this.assignments().length === 0);
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
  }

  getLength(house: string, category: string): number {
    return this.slots().filter(x => x.house === house && x.category === category).length;
  }

  start(): void {
    this.started.set(true);
    this.playName();
  }

  async assign(): Promise<void> {
    let assignments = this.sorter.getAssignmentList(this.partyGuests, this.houses());

    while (assignments == null) {
      console.log('REDO');
      assignments = this.sorter.getAssignmentList(this.partyGuests, this.houses());
    }

    this.assignments.set(assignments);

    this.aiDataService.verifyAsync(assignments.map(x => x.guest)).subscribe();

    this.ready.set(true);
  }

  playName(): void {
    const assignment = this.current();

    if (!assignment) return;

    this.playAudio(assignment.guest);
  }

  next(): void {
    const houses = this.houses();
    const assignment = this.current();

    if (!assignment) return;

    const house = houses.find(x => x.name === assignment.house);
    const person = this.partyGuests.find(x => x.name === assignment.guest);

    if (!house || !person) return;

    const slot = house.slots().find(x => x.category === assignment.category && x.guest == null);

    if (slot == null) {
      console.log('NO SLOT', house.name, person.category, person.name);
      console.log(house.slots());
      return;
    }
    const transcript = `${person.name}... hmmmm... ${house.name}!`;

    //this.aiDataService.getAudioAsync(transcript).subscribe(x => {
    if (!assignment.nameAudio) return;
    console.log('PLAYING', assignment.nameAudio);
    //const audio = new Audio(URL.createObjectURL(assignment.nameAudio));
    //audio.play();

    slot.guest = person;


    house.slots.set(house.slots());

    this.assignments.update(x => {
      x.splice(0, 1);

      return [...x];
    });
  }

  private playAudio(text: string): void {
    const text2 = encodeURIComponent(text);
    const audio = new Audio(`http://localhost:8787/api/text/${text2}`);

    audio.oncanplaythrough = () => {
      audio.play().catch(err => {
        console.error('Error playing audio:', err.message);
      });
    };

    audio.onerror = (err) => {
      console.error('Error loading audio:', err.toString());
    };
  }
}
