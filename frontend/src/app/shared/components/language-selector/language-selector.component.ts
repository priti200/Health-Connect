import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InternationalizationService, Language } from '../../../core/services/internationalization.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css']
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentLanguage = 'en';
  supportedLanguages: Language[] = [];
  isDropdownOpen = false;

  constructor(private i18nService: InternationalizationService) {}

  ngOnInit(): void {
    this.supportedLanguages = this.i18nService.getSupportedLanguages();
    
    this.i18nService.getCurrentLanguage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLanguageChange(languageCode: string): void {
    this.i18nService.setLanguage(languageCode);
    this.isDropdownOpen = false;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  getCurrentLanguageInfo(): Language | undefined {
    return this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
  }

  onClickOutside(): void {
    this.isDropdownOpen = false;
  }
}
