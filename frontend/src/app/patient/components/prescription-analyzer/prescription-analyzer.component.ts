import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Medicine {
  name: string;
  purpose: string;
  pros: string;
  cons: string;
  alternatives: {
    lowCost?: { name: string; price: string; buyLink: string; };
    highCost?: { name: string; price: string; buyLink: string; };
  };
  originalBuyLink: string;
}

interface ParsedResult {
  medicines: Medicine[];
  illnessAnalysis: string;
}

@Component({
  selector: 'app-prescription-analyzer',
  template: `
    <div class="prescription-analyzer p-4">
      <div class="text-center mb-4">
        <h5><i class="bi bi-prescription-bottle-alt me-2"></i>AI Prescription Analyzer</h5>
        <p class="text-muted">Upload your prescription image to get detailed medicine information</p>
      </div>

      <!-- File Upload Section -->
      <div class="upload-section mb-4" *ngIf="!analysisResult">
        <div class="upload-area border-2 border-dashed rounded p-4 text-center" 
             [class.border-primary]="dragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onFileDrop($event)"
             (click)="triggerFileInput()">
          <input type="file" id="fileInput" accept="image/*" (change)="onFileSelected($event)" style="display: none;">
          <i class="bi bi-cloud-upload display-4 text-primary mb-3"></i>
          <h6>Upload Prescription Image</h6>
          <p class="text-muted">Drag and drop or click to browse</p>
          <button type="button" class="btn btn-primary">Choose File</button>
        </div>

        <!-- Selected File -->
        <div *ngIf="selectedFile" class="mt-3 p-3 bg-light rounded">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>{{selectedFile.name}}</strong>
              <small class="text-muted d-block">{{getFileSize(selectedFile.size)}}</small>
            </div>
            <div>
              <button class="btn btn-primary me-2" (click)="analyzePrescription()" [disabled]="isAnalyzing">
                <span *ngIf="isAnalyzing" class="spinner-border spinner-border-sm me-2"></span>
                {{isAnalyzing ? 'Analyzing...' : 'Analyze'}}
              </button>
              <button class="btn btn-outline-secondary" (click)="reset()">Remove</button>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="error" class="alert alert-warning mt-3">
          <div class="d-flex align-items-start">
            <i class="bi bi-exclamation-triangle me-2 mt-1"></i>
            <div class="flex-grow-1">
              <strong>{{error}}</strong>
              <div class="mt-2" *ngIf="error.includes('CORS')">
                <small class="text-muted">
                  <strong>Workaround:</strong> The API works perfectly! You can test it directly using:
                  <br>• The standalone test file: <code>test-prescription-analyzer.html</code>
                  <br>• Or use a browser extension to disable CORS temporarily
                  <br>• The API endpoint: <code>https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant</code>
                </small>
              </div>
              <div class="mt-2">
                <button *ngIf="retryable" class="btn btn-sm btn-outline-primary me-2" (click)="analyzePrescription()">
                  <i class="bi bi-arrow-clockwise me-1"></i>Try Again
                </button>
                <button class="btn btn-sm btn-outline-secondary" (click)="openTestFile()">
                  <i class="bi bi-box-arrow-up-right me-1"></i>Open Test File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div *ngIf="parsedResult" class="results">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h6><i class="bi bi-check-circle text-success me-2"></i>Analysis Complete</h6>
          <button class="btn btn-outline-primary btn-sm" (click)="reset()">
            <i class="bi bi-plus-circle me-1"></i>Analyze Another
          </button>
        </div>

        <!-- Medicines Section -->
        <div class="medicines-section mb-4" *ngIf="parsedResult.medicines && parsedResult.medicines.length > 0">
          <h5 class="section-title mb-3">
            <i class="bi bi-capsule me-2 text-primary"></i>
            Medicines Found ({{ parsedResult.medicines.length }})
          </h5>

          <div class="row">
            <div class="col-lg-6 mb-4" *ngFor="let medicine of parsedResult.medicines">
              <div class="medicine-card h-100">
                <div class="card-header bg-primary text-white">
                  <h6 class="mb-0">{{ medicine.name }}</h6>
                </div>
                <div class="card-body">
                  <!-- Purpose -->
                  <div class="info-section mb-3" *ngIf="medicine.purpose">
                    <div class="info-header">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      <strong>Purpose</strong>
                    </div>
                    <p class="info-content">{{ medicine.purpose }}</p>
                  </div>

                  <!-- Pros -->
                  <div class="info-section mb-3" *ngIf="medicine.pros">
                    <div class="info-header">
                      <i class="bi bi-plus-circle-fill text-info me-2"></i>
                      <strong>Pros</strong>
                    </div>
                    <p class="info-content">{{ medicine.pros }}</p>
                  </div>

                  <!-- Cons -->
                  <div class="info-section mb-3" *ngIf="medicine.cons">
                    <div class="info-header">
                      <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                      <strong>Cons</strong>
                    </div>
                    <p class="info-content">{{ medicine.cons }}</p>
                  </div>

                  <!-- Alternatives -->
                  <div class="alternatives-section" *ngIf="medicine.alternatives && (medicine.alternatives.lowCost || medicine.alternatives.highCost)">
                    <div class="info-header mb-2">
                      <i class="bi bi-arrow-repeat text-secondary me-2"></i>
                      <strong>Alternatives</strong>
                    </div>

                    <!-- Low Cost Alternative -->
                    <div class="alternative-card mb-2" *ngIf="medicine.alternatives.lowCost">
                      <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <div>
                          <div class="fw-medium text-success">{{ medicine.alternatives.lowCost.name }}</div>
                          <small class="text-muted">{{ medicine.alternatives.lowCost.price }}</small>
                        </div>
                        <button
                          class="btn btn-sm btn-success"
                          (click)="openBuyLink(medicine.alternatives.lowCost.buyLink)"
                          *ngIf="medicine.alternatives.lowCost.buyLink">
                          <i class="bi bi-cart-plus me-1"></i>Buy
                        </button>
                      </div>
                    </div>

                    <!-- High Cost Alternative -->
                    <div class="alternative-card mb-2" *ngIf="medicine.alternatives.highCost">
                      <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <div>
                          <div class="fw-medium text-primary">{{ medicine.alternatives.highCost.name }}</div>
                          <small class="text-muted">{{ medicine.alternatives.highCost.price }}</small>
                        </div>
                        <button
                          class="btn btn-sm btn-primary"
                          (click)="openBuyLink(medicine.alternatives.highCost.buyLink)"
                          *ngIf="medicine.alternatives.highCost.buyLink">
                          <i class="bi bi-cart-plus me-1"></i>Buy
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Original Medicine Buy Link -->
                  <div class="original-medicine mt-3" *ngIf="medicine.originalBuyLink">
                    <button
                      class="btn btn-outline-primary w-100"
                      (click)="openBuyLink(medicine.originalBuyLink)">
                      <i class="bi bi-globe me-2"></i>
                      Buy Original Medicine
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Illness Analysis -->
        <div class="illness-analysis mb-4" *ngIf="parsedResult.illnessAnalysis">
          <h5 class="section-title mb-3">
            <i class="bi bi-heart-pulse me-2 text-danger"></i>
            Possible Illness Analysis
          </h5>

          <div class="card border-info">
            <div class="card-body">
              <div class="d-flex align-items-start">
                <i class="bi bi-brain me-3 text-info" style="font-size: 1.5rem;"></i>
                <div>
                  <h6 class="text-info mb-2">AI Analysis</h6>
                  <p class="mb-0">{{ parsedResult.illnessAnalysis }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <div class="alert alert-warning border-warning">
            <div class="d-flex align-items-start">
              <i class="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
              <div>
                <strong>Medical Disclaimer:</strong> This analysis is for informational purposes only.
                Always consult with your healthcare provider before making any changes to your medication or treatment plan.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="isAnalyzing" class="text-center py-5">
        <div class="spinner-border text-primary mb-3"></div>
        <h6>Analyzing your prescription...</h6>
        <p class="text-muted">This may take a few moments</p>
      </div>
    </div>
  `,
  styles: [`
    .upload-area {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px dashed #dee2e6;
    }
    .upload-area:hover, .upload-area.border-primary {
      background-color: #f8f9fa;
      border-color: #0d6efd;
    }
    .prescription-analyzer {
      max-width: 1200px;
      margin: 0 auto;
    }
    .section-title {
      color: #495057;
      font-weight: 600;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 0.5rem;
    }
    .medicine-card {
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .medicine-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }
    .medicine-card .card-header {
      border-bottom: none;
      font-weight: 600;
    }
    .info-section {
      border-left: 3px solid #e9ecef;
      padding-left: 1rem;
      margin-left: 0.5rem;
    }
    .info-header {
      display: flex;
      align-items: center;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .info-content {
      color: #6c757d;
      margin-bottom: 0;
      line-height: 1.5;
    }
    .alternatives-section {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }
    .alternative-card {
      transition: all 0.3s ease;
    }
    .alternative-card:hover {
      transform: translateX(5px);
    }
    .illness-analysis .card {
      border: 2px solid #bee5eb;
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    }
    .disclaimer .alert {
      border-radius: 12px;
      border: 2px solid #ffeaa7;
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    }
    .btn {
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    .btn:hover {
      transform: translateY(-1px);
    }
    .results {
      animation: fadeInUp 0.5s ease-out;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class PrescriptionAnalyzerComponent {
  selectedFile: File | null = null;
  isAnalyzing = false;
  analysisResult: string | null = null;
  parsedResult: ParsedResult | null = null;
  error: string | null = null;
  retryable = false;
  dragOver = false;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.isValidImageFile(file)) {
      this.selectedFile = file;
      this.error = null;
    } else {
      this.error = 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidImageFile(file)) {
        this.selectedFile = file;
        this.error = null;
      } else {
        this.error = 'Please select a valid image file';
      }
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      return false;
    }
    
    if (file.size > maxSize) {
      this.error = 'File size must be less than 10MB';
      return false;
    }
    
    return true;
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  analyzePrescription(): void {
    if (!this.selectedFile) {
      this.error = 'Please select a file first';
      return;
    }

    this.isAnalyzing = true;
    this.error = null;
    this.retryable = false;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.callGeminiAPI(base64);
    };
    reader.onerror = () => {
      this.isAnalyzing = false;
      this.error = 'Failed to read image file';
    };
    reader.readAsDataURL(this.selectedFile);
  }

  private callGeminiAPI(base64Image: string): void {
    // Use backend proxy to avoid CORS issues
    const proxyApiUrl = `${environment.apiUrl}/gemini/analyze`;

    const requestBody = {
      image_base64: base64Image
    };

    console.log('Calling Gemini Medical Assistant API via backend proxy...');

    // Call backend proxy (no authentication required for this endpoint)
    const headers = {
      'Content-Type': 'application/json'
    };

    this.http.post(proxyApiUrl, requestBody, {
      headers,
      responseType: 'text'
    }).subscribe({
      next: (response: string) => {
        console.log('Gemini API response received successfully via proxy');
        this.analysisResult = response;
        this.parsedResult = this.parseAPIResponse(response);
        this.isAnalyzing = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Gemini API call failed via proxy:', error);
        this.handleAPIError(error);
      }
    });
  }



  private handleAPIError(error: HttpErrorResponse): void {
    console.error('Gemini API error:', error);
    this.isAnalyzing = false;

    if (error.status === 503 || error.status === 502 || error.status === 504) {
      this.error = 'Gemini AI service temporarily unavailable. Please try again in a few moments.';
      this.retryable = true;
    } else if (error.status === 429) {
      this.error = 'Too many requests to Gemini AI. Please wait a moment before trying again.';
      this.retryable = true;
    } else if (error.status === 0) {
      this.error = 'Unable to connect to Gemini AI service. This may be due to network restrictions. Please try again or use the standalone test page.';
      this.retryable = true;
    } else if (error.status === 400) {
      this.error = 'Invalid image format. Please ensure you upload a clear prescription image (JPEG, PNG, GIF, or WebP).';
      this.retryable = true;
    } else {
      this.error = `Failed to analyze prescription (Error ${error.status}). Please try again or use the standalone test page.`;
      this.retryable = true;
    }
  }

  private parseAPIResponse(response: string): ParsedResult {
    try {
      // Parse JSON response if it's wrapped in JSON
      let responseText = response;
      if (response.startsWith('{') && response.includes('"response"')) {
        const jsonResponse = JSON.parse(response);
        responseText = jsonResponse.response || response;
      }

      const medicines: Medicine[] = [];
      const lines = responseText.split('\n');
      let currentMedicine: Partial<Medicine> | null = null;
      let illnessAnalysis = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for medicine name (starts with ** and ends with **)
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          // Save previous medicine if exists
          if (currentMedicine && currentMedicine.name) {
            medicines.push(currentMedicine as Medicine);
          }

          // Start new medicine
          currentMedicine = {
            name: line.replace(/\*\*/g, '').trim(),
            purpose: '',
            pros: '',
            cons: '',
            alternatives: {},
            originalBuyLink: ''
          };
        }
        // Parse medicine details
        else if (currentMedicine) {
          if (line.includes('✅ Purpose:') || line.includes('Purpose:')) {
            currentMedicine.purpose = line.replace(/.*Purpose:\s*/, '').trim();
          } else if (line.includes('➕ Pros:') || line.includes('Pros:')) {
            currentMedicine.pros = line.replace(/.*Pros:\s*/, '').trim();
          } else if (line.includes('⚠️ Cons:') || line.includes('Cons:')) {
            currentMedicine.cons = line.replace(/.*Cons:\s*/, '').trim();
          } else if (line.includes('Low-cost alternative:')) {
            const match = line.match(/Low-cost alternative:\s*(.+?)\s*–\s*(.+)/);
            if (match) {
              if (!currentMedicine.alternatives) currentMedicine.alternatives = {};
              currentMedicine.alternatives.lowCost = {
                name: match[1].trim(),
                price: match[2].trim(),
                buyLink: ''
              };
            }
          } else if (line.includes('High-cost branded alternative:')) {
            const match = line.match(/High-cost branded alternative:\s*(.+?)\s*–\s*(.+)/);
            if (match) {
              if (!currentMedicine.alternatives) currentMedicine.alternatives = {};
              currentMedicine.alternatives.highCost = {
                name: match[1].trim(),
                price: match[2].trim(),
                buyLink: ''
              };
            }
          } else if (line.includes('Buy: https://')) {
            const url = line.replace(/.*Buy:\s*/, '').trim();
            // Assign to the most recent alternative or original
            if (currentMedicine.alternatives?.highCost && !currentMedicine.alternatives.highCost.buyLink) {
              currentMedicine.alternatives.highCost.buyLink = url;
            } else if (currentMedicine.alternatives?.lowCost && !currentMedicine.alternatives.lowCost.buyLink) {
              currentMedicine.alternatives.lowCost.buyLink = url;
            } else {
              currentMedicine.originalBuyLink = url;
            }
          }
        }
        // Check for illness analysis
        else if (line.includes('🧠 Possible illness') || line.includes('illness based on')) {
          // Collect illness analysis from this line and subsequent lines
          let analysisLines = [line];
          for (let j = i + 1; j < lines.length && j < i + 10; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.startsWith('**') && !nextLine.includes('Buy:')) {
              analysisLines.push(nextLine);
            } else {
              break;
            }
          }
          illnessAnalysis = analysisLines.join(' ').replace(/🧠\s*/, '').trim();
        }
      }

      // Add the last medicine
      if (currentMedicine && currentMedicine.name) {
        medicines.push(currentMedicine as Medicine);
      }

      return {
        medicines,
        illnessAnalysis
      };
    } catch (error) {
      console.error('Error parsing API response:', error);
      return {
        medicines: [],
        illnessAnalysis: 'Failed to parse analysis results.'
      };
    }
  }

  openBuyLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  reset(): void {
    this.selectedFile = null;
    this.analysisResult = null;
    this.parsedResult = null;
    this.error = null;
    this.isAnalyzing = false;
    this.retryable = false;
  }

  openTestFile(): void {
    // Open the standalone test file in a new tab
    window.open('/assets/test-prescription-analyzer.html', '_blank');
  }
}
