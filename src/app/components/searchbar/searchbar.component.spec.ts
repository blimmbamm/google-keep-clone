import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SearchbarComponent } from './searchbar.component';

describe('SearchbarComponent', () => {
  let component: SearchbarComponent;
  let fixture: ComponentFixture<SearchbarComponent>;
  let inputElement: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchbarComponent);
    component = fixture.componentInstance;
    inputElement = fixture.debugElement.query(By.css('input'))
      .nativeElement as HTMLInputElement;

    fixture.detectChanges();
  });

  it(`when input is focussed/blurred, inputFocussed should be updated accordingly`, () => {
    component.inputFocussed.set(false);

    inputElement.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(component.inputFocussed()).toBeTrue();

    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(component.inputFocussed()).toBeFalse();
  });

  function triggerButtonMousedownEvent(index: number) {
    fixture.debugElement
      .queryAll(By.css('button'))
      [index].triggerEventHandler('mousedown', new MouseEvent('mousedown'));
  }

  it(`when clicking (mousedown) search button, input should get focussed and`, () => {
    triggerButtonMousedownEvent(0);

    expect(document.activeElement).toBe(inputElement);
  });

  it(`when clicking clear button, input should get focussed & cleared`, () => {
    inputElement.value = 'Some input value';

    triggerButtonMousedownEvent(1);

    expect(document.activeElement).toBe(inputElement);
    expect(inputElement.value).toEqual('');
  });
});
