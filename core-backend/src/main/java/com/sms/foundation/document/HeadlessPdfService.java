package com.sms.foundation.document;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class HeadlessPdfService {

    private static final String PDF_MAGIC = "%PDF-";
    private static final long TIMEOUT_SECONDS = 30;

    public byte[] renderHtmlToPdf(String htmlContent) {
        return renderHtmlToPdf(htmlContent, false);
    }

    public byte[] renderHtmlToPdf(String htmlContent, boolean landscape) {
        if (htmlContent == null || htmlContent.isBlank()) {
            throw new IllegalArgumentException("HTML content cannot be empty for PDF generation");
        }

        Path tempHtml = null;
        Path tempPdf = null;

        try {
            tempHtml = Files.createTempFile("sms-print-", ".html");
            tempPdf = Files.createTempFile("sms-render-", ".pdf");

            // Write HTML content to temporary file with UTF-8
            Files.writeString(tempHtml, htmlContent, StandardCharsets.UTF_8);

            // Step 1: Attempt rendering with Node.js Playwright runner script
            boolean rendered = tryRenderWithPlaywright(tempHtml, tempPdf, landscape);

            // Step 2: Fallback to direct Chromium/Edge headless CLI if Playwright failed
            if (!rendered || !Files.exists(tempPdf) || Files.size(tempPdf) == 0) {
                log.info("Playwright rendering not available or failed. Attempting direct Chromium headless CLI fallback...");
                rendered = tryRenderWithChromiumCli(tempHtml, tempPdf, landscape);
            }

            if (!rendered || !Files.exists(tempPdf) || Files.size(tempPdf) == 0) {
                throw new IllegalStateException("Failed to generate PDF: Headless browser process did not produce output");
            }

            byte[] pdfBytes = Files.readAllBytes(tempPdf);
            if (pdfBytes.length < 5 || !new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII).startsWith(PDF_MAGIC)) {
                throw new IllegalStateException("Generated file is not a valid PDF document");
            }

            log.info("Successfully generated PDF: {} bytes (landscape={})", pdfBytes.length, landscape);
            return pdfBytes;

        } catch (Exception ex) {
            log.error("PDF generation failed: {}", ex.getMessage(), ex);
            throw new RuntimeException("Error rendering document to PDF: " + ex.getMessage(), ex);
        } finally {
            if (tempHtml != null) {
                try {
                    Files.deleteIfExists(tempHtml);
                } catch (Exception ignored) {
                }
            }
            if (tempPdf != null) {
                try {
                    Files.deleteIfExists(tempPdf);
                } catch (Exception ignored) {
                }
            }
        }
    }

    private boolean tryRenderWithPlaywright(Path tempHtml, Path tempPdf, boolean landscape) {
        try {
            Path scriptPath = resolveRendererScriptPath();
            if (scriptPath == null || !Files.exists(scriptPath)) {
                log.warn("Playwright renderer script not found");
                return false;
            }

            ProcessBuilder pb = new ProcessBuilder(
                    "node",
                    scriptPath.toAbsolutePath().toString(),
                    tempHtml.toAbsolutePath().toString(),
                    tempPdf.toAbsolutePath().toString(),
                    String.valueOf(landscape)
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                log.warn("Playwright PDF generation timed out after {} seconds", TIMEOUT_SECONDS);
                return false;
            }

            int exitCode = process.exitValue();
            if (exitCode == 0 && Files.exists(tempPdf) && Files.size(tempPdf) > 0) {
                return true;
            } else {
                log.warn("Playwright runner exited with code: {}", exitCode);
                return false;
            }
        } catch (Exception ex) {
            log.warn("Playwright execution attempt failed: {}", ex.getMessage());
            return false;
        }
    }

    private boolean tryRenderWithChromiumCli(Path tempHtml, Path tempPdf, boolean landscape) {
        List<String> browserPaths = getCandidateChromiumPaths();

        for (String browserPath : browserPaths) {
            File browserExe = new File(browserPath);
            if (browserExe.exists() && browserExe.canExecute()) {
                try {
                    List<String> args = new ArrayList<>();
                    args.add(browserPath);
                    args.add("--headless");
                    args.add("--disable-gpu");
                    args.add("--no-sandbox");
                    args.add("--no-pdf-header-footer");
                    args.add("--print-to-pdf=" + tempPdf.toAbsolutePath().toString());
                    args.add(tempHtml.toAbsolutePath().toString());

                    ProcessBuilder pb = new ProcessBuilder(args);
                    pb.redirectErrorStream(true);
                    Process process = pb.start();
                    boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

                    if (!finished) {
                        process.destroyForcibly();
                        continue;
                    }

                    if (process.exitValue() == 0 && Files.exists(tempPdf) && Files.size(tempPdf) > 0) {
                        log.info("PDF generated via Chromium CLI executable: {}", browserPath);
                        return true;
                    }
                } catch (Exception ex) {
                    log.warn("Chromium CLI attempt failed on {}: {}", browserPath, ex.getMessage());
                }
            }
        }
        return false;
    }

    private Path resolveRendererScriptPath() {
        // 1. Direct file path in source / project directory
        Path localPath = Paths.get("core-backend/src/main/resources/scripts/pdf-renderer.js");
        if (Files.exists(localPath)) {
            return localPath;
        }
        Path relPath = Paths.get("src/main/resources/scripts/pdf-renderer.js");
        if (Files.exists(relPath)) {
            return relPath;
        }

        // 2. Classpath resource extraction
        try (InputStream is = getClass().getResourceAsStream("/scripts/pdf-renderer.js")) {
            if (is != null) {
                Path tempScript = Files.createTempFile("pdf-renderer-", ".js");
                tempScript.toFile().deleteOnExit();
                try (FileOutputStream fos = new FileOutputStream(tempScript.toFile())) {
                    is.transferTo(fos);
                }
                return tempScript;
            }
        } catch (Exception e) {
            log.warn("Failed to extract renderer script from classpath: {}", e.getMessage());
        }

        return null;
    }

    private List<String> getCandidateChromiumPaths() {
        List<String> paths = new ArrayList<>();
        // Windows
        paths.add("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe");
        paths.add("C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe");
        paths.add("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
        paths.add("C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe");
        // Linux / Docker
        paths.add("/usr/bin/chromium-browser");
        paths.add("/usr/bin/chromium");
        paths.add("/usr/bin/google-chrome");
        paths.add("/usr/bin/google-chrome-stable");
        paths.add("/usr/bin/microsoft-edge");
        paths.add("/usr/bin/msedge");
        return paths;
    }
}

