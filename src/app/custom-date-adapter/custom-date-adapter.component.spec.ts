import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomDateAdapterComponent } from './custom-date-adapter.component';

describe('CustomDateAdapterComponent', () => {
  let component: CustomDateAdapterComponent;
  let fixture: ComponentFixture<CustomDateAdapterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomDateAdapterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomDateAdapterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
