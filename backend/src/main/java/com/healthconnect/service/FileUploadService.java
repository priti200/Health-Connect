package com.healthconnect.service;

import com.healthconnect.config.FileUploadConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileUploadService {

    private final FileUploadConfig fileUploadConfig;

    // Image file extensions
    private static final List<String> IMAGE_EXTENSIONS = Arrays.asList(
        "jpg", "jpeg", "png", "gif", "bmp", "webp"
    );

    // Document file extensions
    private static final List<String> DOCUMENT_EXTENSIONS = Arrays.asList(
        "pdf", "doc", "docx", "txt", "rtf", "odt"
    );

    // Audio file extensions
    private static final List<String> AUDIO_EXTENSIONS = Arrays.asList(
        "mp3", "wav", "ogg", "m4a", "aac"
    );

    // Video file extensions
    private static final List<String> VIDEO_EXTENSIONS = Arrays.asList(
        "mp4", "avi", "mov", "wmv", "flv", "webm"
    );

    public FileUploadResult uploadFile(MultipartFile file, Long userId) throws IOException {
        validateFile(file);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String filename = fileUploadConfig.generateFileName(originalFilename);
        
        // Create user-specific directory
        Path userUploadPath = fileUploadConfig.getUploadPath().resolve(userId.toString());
        Files.createDirectories(userUploadPath);
        
        // Save file
        Path filePath = userUploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Generate file URL
        String fileUrl = "/uploads/" + userId + "/" + filename;
        
        log.info("File uploaded successfully: {} -> {}", originalFilename, fileUrl);
        
        return FileUploadResult.builder()
                .originalFilename(originalFilename)
                .filename(filename)
                .fileUrl(fileUrl)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .filePath(filePath.toString())
                .build();
    }

    public void deleteFile(String filePath) {
        try {
            Path path = Path.of(filePath);
            Files.deleteIfExists(path);
            log.info("File deleted: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
        }
    }

    public boolean fileExists(String filePath) {
        return Files.exists(Path.of(filePath));
    }

    public String getFileCategory(String filename) {
        if (filename == null) {
            return "unknown";
        }
        
        String extension = getFileExtension(filename).toLowerCase();
        
        if (IMAGE_EXTENSIONS.contains(extension)) {
            return "image";
        } else if (DOCUMENT_EXTENSIONS.contains(extension)) {
            return "document";
        } else if (AUDIO_EXTENSIONS.contains(extension)) {
            return "audio";
        } else if (VIDEO_EXTENSIONS.contains(extension)) {
            return "video";
        } else {
            return "file";
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > fileUploadConfig.getMaxFileSize()) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size");
        }

        if (!fileUploadConfig.isAllowedFileType(file.getContentType())) {
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        }

        String filename = file.getOriginalFilename();
        if (filename != null && (filename.contains("..") || filename.contains("/"))) {
            throw new IllegalArgumentException("Invalid filename");
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex > 0 ? filename.substring(dotIndex + 1) : "";
    }

    public static class FileUploadResult {
        private String originalFilename;
        private String filename;
        private String fileUrl;
        private String fileType;
        private Long fileSize;
        private String filePath;

        public static FileUploadResultBuilder builder() {
            return new FileUploadResultBuilder();
        }

        // Getters
        public String getOriginalFilename() { return originalFilename; }
        public String getFilename() { return filename; }
        public String getFileUrl() { return fileUrl; }
        public String getFileType() { return fileType; }
        public Long getFileSize() { return fileSize; }
        public String getFilePath() { return filePath; }

        public static class FileUploadResultBuilder {
            private String originalFilename;
            private String filename;
            private String fileUrl;
            private String fileType;
            private Long fileSize;
            private String filePath;

            public FileUploadResultBuilder originalFilename(String originalFilename) {
                this.originalFilename = originalFilename;
                return this;
            }

            public FileUploadResultBuilder filename(String filename) {
                this.filename = filename;
                return this;
            }

            public FileUploadResultBuilder fileUrl(String fileUrl) {
                this.fileUrl = fileUrl;
                return this;
            }

            public FileUploadResultBuilder fileType(String fileType) {
                this.fileType = fileType;
                return this;
            }

            public FileUploadResultBuilder fileSize(Long fileSize) {
                this.fileSize = fileSize;
                return this;
            }

            public FileUploadResultBuilder filePath(String filePath) {
                this.filePath = filePath;
                return this;
            }

            public FileUploadResult build() {
                FileUploadResult result = new FileUploadResult();
                result.originalFilename = this.originalFilename;
                result.filename = this.filename;
                result.fileUrl = this.fileUrl;
                result.fileType = this.fileType;
                result.fileSize = this.fileSize;
                result.filePath = this.filePath;
                return result;
            }
        }
    }
}
