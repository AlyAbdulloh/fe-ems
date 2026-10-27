import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EventItem } from '../../../core/services/event.service';
import { User } from '../../../core/models/user.model';
import { EventDisplayService } from '../services/event-display.service';

@Component({
  selector: 'app-event-spotlight',
  templateUrl: './event-spotlight.component.html',
  styleUrls: ['./event-spotlight.component.scss'],
})
export class EventSpotlightComponent {
  @Input() event!: EventItem;
  @Input() currentUser: User | null = null;

  @Output() openDetail = new EventEmitter<EventItem>();
  @Output() register = new EventEmitter<EventItem>();

  constructor(readonly display: EventDisplayService) {}

  get isPast(): boolean {
    return this.display.isEventPast(this.event);
  }

  get isMine(): boolean {
    return this.display.isMyEvent(this.currentUser, this.event);
  }

  openDetailFromKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openDetail.emit(this.event);
    }
  }
}
