import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { VenuesRoutingModule } from './venues-routing.module';
import { VenueManageComponent } from './venue-manage.component';

@NgModule({
  declarations: [VenueManageComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LeafletModule,
    NgbPaginationModule,
    VenuesRoutingModule,
  ],
})
export class VenuesModule {}
