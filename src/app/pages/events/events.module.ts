import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { EventsRoutingModule } from './events-routing.module';
import { EventCreateComponent } from './create/event-create.component';
import { EventManageComponent } from './manage/event-manage.component';
import { EventDetailComponent } from './detail/event-detail.component';

@NgModule({
  declarations: [EventCreateComponent, EventManageComponent, EventDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    EventsRoutingModule,
  ],
})
export class EventsModule {}
