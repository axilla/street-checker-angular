import { Component } from '@angular/core';
import {NativeDateAdapter} from '@angular/material';

@Component({
  selector: 'app-custom-date-adapter',
  templateUrl: './custom-date-adapter.component.html',
  styleUrls: ['./custom-date-adapter.component.sass']
})
export class CustomDateAdapterComponent extends NativeDateAdapter {

  format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
      // return `${day}/${month}/${year}`
    } else {
      return date.toDateString();
    }
  }
  getFirstDayOfWeek(): number {
    return 1;
  }

}
