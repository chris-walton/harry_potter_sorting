import { Component } from '@angular/core';
import { HOUSES } from './env/houses';
import { PARTY_GUESTS } from './env/party-guests';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [],
})
export class AppComponent {
  title = 'site';
  houses = HOUSES;
  partyGuests = PARTY_GUESTS;
}
