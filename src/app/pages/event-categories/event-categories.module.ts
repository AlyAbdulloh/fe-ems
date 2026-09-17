import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventCategoriesRoutingModule } from './event-categories-routing.module';
import { CategoryManageComponent } from './category-manage.component';

@NgModule({
  declarations: [CategoryManageComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EventCategoriesRoutingModule,
  ],
})
export class EventCategoriesModule {}
