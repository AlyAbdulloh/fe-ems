import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EventItem } from '../../../core/services/event.service';
import { User } from '../../../core/models/user.model';
import { EventDisplayService } from '../services/event-display.service';

@Component({
  selector: 'app-event-detail-modal',
  templateUrl: './event-detail-modal.component.html',
  styleUrls: ['./event-detail-modal.component.scss'],
})
export class EventDetailModalComponent {
  @Input() event!: EventItem;
  @Input() currentUser: User | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() register = new EventEmitter<EventItem>();

  constructor(readonly display: EventDisplayService) {}

  get isPast(): boolean {
    return this.display.isEventPast(this.event);
  }

  get isMine(): boolean {
    return this.display.isMyEvent(this.currentUser, this.event);
  }

  trackBySession(index: number, item: any): string {
    return item.id;
  }

  trackByTicket(index: number, item: any): string {
    return item.id;
  }
}
