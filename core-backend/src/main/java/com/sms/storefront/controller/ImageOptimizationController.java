package com.sms.storefront.controller;

import com.sms.storefront.service.ImageOptimizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/storefront/images")
@RequiredArgsConstructor
public class ImageOptimizationController {

    private final ImageOptimizationService imageOptimizationService;

    @GetMapping("/responsive-set")
    public ResponseEntity<ImageOptimizationService.ResponsiveImageSet> getResponsiveSet(
            @RequestParam String url
    ) {
        ImageOptimizationService.ResponsiveImageSet set = imageOptimizationService.generateResponsiveSet(url);
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.LINK, set.preloadLinkHeader());
        return ResponseEntity.ok().headers(headers).body(set);
    }

    @GetMapping("/preload-hint")
    public ResponseEntity<Map<String, String>> getPreloadHint(
            @RequestParam String url,
            @RequestParam(required = false) String sizes
    ) {
        ImageOptimizationService.ResponsiveImageSet set = imageOptimizationService.generateResponsiveSet(url);
        String linkHeader = imageOptimizationService.generatePreloadLinkHeader(set.heroUrl(), set.srcSetWebp(), sizes);
        String htmlTag = imageOptimizationService.generatePreloadHtmlTag(set.heroUrl(), set.srcSetWebp(), sizes);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.LINK, linkHeader);
        return ResponseEntity.ok()
                .headers(headers)
                .body(Map.of(
                        "originalUrl", url,
                        "heroUrl", set.heroUrl(),
                        "srcSetWebp", set.srcSetWebp(),
                        "preloadLinkHeader", linkHeader,
                        "preloadHtmlTag", htmlTag
                ));
    }

    @GetMapping("/lqip")
    public ResponseEntity<Map<String, String>> getLqip(
            @RequestParam String url
    ) {
        String lqip = imageOptimizationService.generateLqip(url);
        return ResponseEntity.ok(Map.of("url", url, "lqipDataUri", lqip));
    }

    @GetMapping("/transform")
    public ResponseEntity<Void> transformProxy(
            @RequestParam String url,
            @RequestParam(defaultValue = "400") int w,
            @RequestParam(defaultValue = "400") int h,
            @RequestParam(defaultValue = "80") int q,
            @RequestParam(defaultValue = "webp") String fmt
    ) {
        String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8);
        String optimized = imageOptimizationService.getOptimizedUrl(decodedUrl, w, h, q, fmt);

        // Redirect client to edge CDN / upstream optimized asset with immutable cache headers
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(optimized));
        headers.setCacheControl("public, max-age=2592000, immutable"); // Cache for 30 days
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}
