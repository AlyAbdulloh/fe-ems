import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DiscoverRoutingModule } from './discover-routing.module';
import { DiscoverComponent } from './discover.component';
import { EventCardComponent } from './event-card/event-card.component';
import { EventSpotlightComponent } from './event-spotlight/event-spotlight.component';
import { EventDetailModalComponent } from './event-detail-modal/event-detail-modal.component';
import { EventRegistrationModalComponent } from './event-registration-modal/event-registration-modal.component';

@NgModule({
  declarations: [
    DiscoverComponent,
    EventCardComponent,
    EventSpotlightComponent,
    EventDetailModalComponent,
    EventRegistrationModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DiscoverRoutingModule,
  ],
})
export class DiscoverModule {}
