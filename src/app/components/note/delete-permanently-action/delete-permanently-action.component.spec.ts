import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletePermanentlyActionComponent } from './delete-permanently-action.component';

describe('DeletePermanentlyActionComponent', () => {
  let component: DeletePermanentlyActionComponent;
  let fixture: ComponentFixture<DeletePermanentlyActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletePermanentlyActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletePermanentlyActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
