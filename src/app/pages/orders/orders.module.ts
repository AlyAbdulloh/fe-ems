import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { OrdersRoutingModule } from './orders-routing.module';
import { MyOrdersComponent } from './list/my-orders.component';
import { MyOrderDetailComponent } from './detail/my-order-detail.component';

@NgModule({
  declarations: [MyOrdersComponent, MyOrderDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbPaginationModule,
    OrdersRoutingModule,
  ],
})
export class OrdersModule {}
