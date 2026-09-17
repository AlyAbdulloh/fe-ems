import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventsRoutingModule } from './events-routing.module';
import { EventCreateComponent } from './event-create.component';
import { EventManageComponent } from './event-manage.component';

@NgModule({
  declarations: [EventCreateComponent, EventManageComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EventsRoutingModule,
  ],
})
export class EventsModule {}
