import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module'; // Ensure your SharedModule is mocked or configured for testing
import { DutchService } from './services/dutch.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { of, throwError } from 'rxjs';
import { iCategory } from './models/dutch.interface';
import { By } from '@angular/platform-browser';
import { FormControl } from '@angular/forms'; // Import FormControl for testing searchTerm
import { DebugElement } from '@angular/core'; // Import DebugElement for testing searchTerm


describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let dutchServiceSpy: jasmine.SpyObj<DutchService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let bottomSheetSpy: jasmine.SpyObj<MatBottomSheet>;

  const mockData: iCategory[] = [
    { category: { name: 'Category 1', slug: 'category-1', companies: [] } },
    { category: { name: 'Category 2', slug: 'category-2', companies: [] } }
  ];

  beforeEach(async () => {
    dutchServiceSpy = jasmine.createSpyObj('DutchService', ['loadJson']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);

    await TestBed.configureTestingModule({
      imports: [SharedModule], 
      declarations: [AppComponent],
      providers: [
        { provide: DutchService, useValue: dutchServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatBottomSheet, useValue: bottomSheetSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading snackbar on initialization', () => {
    expect(snackBarSpy.open).toHaveBeenCalledWith('Loading latest update from Github', 'Ok', { duration: 10000 });
  });

  it('should load JSON data successfully', fakeAsync(() => {
    dutchServiceSpy.loadJson.and.returnValue(of(mockData));

    component.loadJson();
    tick(); // Simulate passage of time for observables to complete
    fixture.detectChanges();

    expect(component.list_of_categories).toEqual(mockData);
    expect(component.busy).toBeFalse();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Loaded data successfully', 'Ok', { duration: 5000 });
  }));

  it('should handle error when loading JSON data', fakeAsync(() => {
    dutchServiceSpy.loadJson.and.returnValue(throwError(() => new Error('Error loading data')));

    component.loadJson();
    tick();
    fixture.detectChanges();

    expect(component.busy).toBeFalse(); 
    expect(snackBarSpy.open).toHaveBeenCalledWith('Error loading data, using locally stored data instead', 'Ok', { duration: 5000 });
  }));


  it('should filter companies by category and search term', () => {
    component.list_of_categories = mockData;
    component.filteredCompanies = mockData.flatMap(category => category.category.companies); 

    component.filterCompanies('category-1', 'test'); 
    expect(component.activeCategory).toEqual('category-1'); 
    expect(component.filteredCompanies).toEqual([]);

  });

   it('should filter companies when searchTerm changes', fakeAsync(() => {
    component.list_of_categories = mockData;
    component.filteredCompanies = mockData.flatMap(category => category.category.companies);

    fixture.detectChanges();

    const searchTermInput: DebugElement = fixture.debugElement.query(By.css('[formControlName="searchTerm"]'));
    const inputElement: HTMLInputElement = searchTermInput.nativeElement;

    inputElement.value = 'test';
    inputElement.dispatchEvent(new Event('input')); 

    tick(500); 
    fixture.detectChanges();

    expect(component.activeCategory).toEqual('all'); 
    expect(component.filteredCompanies).toEqual([]); 
  }));
  
  it('should clear searchTerm when clear button is clicked', () => {
    const searchTermControl = new FormControl('initial search term');
    component.searchTerm = searchTermControl;

    fixture.detectChanges();

    const clearButton = fixture.debugElement.query(By.css('.mat-form-field-suffix button'));
    clearButton.triggerEventHandler('click', null);

    expect(component.searchTerm.value).toBeNull(); 
  });
});
